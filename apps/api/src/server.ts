import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { Prisma, PrismaClient } from "@prisma/client";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { z } from "zod";
import { aiDraftSchema, aiReplySchema, createAutomationSchema, paginationSchema, readEnv } from "../../../packages/shared/src";
import { emailPrompt, generateWithGemini } from "./ai";
import { requireAuth, signSession } from "./auth";
import { createCheckoutSession, handleStripeWebhook } from "./billing";
import { gmailAuthUrl, connectGmailAccount, sendGmailMessage, syncGmailInbox } from "./gmail";
import { microsoftAuthUrl, connectOutlookAccount, sendOutlookMessage, syncOutlookInbox } from "./outlook";
import { sendSmtpMessage, syncImapInbox } from "./mail-fallback";
import { createAttachmentDownloadUrl, createAttachmentUploadUrl } from "./storage";

const env = readEnv(process.env);
const prisma = new PrismaClient();
const redis = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
const aiQueue = new Queue("ai-jobs", { connection: redis });

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: env.WEB_URL, credentials: true },
});

app.use(helmet());
app.use(cors({ origin: env.WEB_URL, credentials: true }));

app.post("/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const event = await handleStripeWebhook({
      prisma,
      stripeSecretKey: env.STRIPE_SECRET_KEY,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET,
      signature: req.header("stripe-signature") ?? undefined,
      rawBody: req.body,
    });
    res.json({ received: true, type: event.type });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Stripe webhook failed" });
  }
});

app.use(express.json({ limit: "5mb" }));
app.use(rateLimit({ windowMs: 60_000, limit: 120 }));

const stateSchema = z.object({
  userId: z.string(),
  workspaceId: z.string(),
  returnTo: z.string().optional(),
});

function encodeState(input: z.infer<typeof stateSchema>) {
  return Buffer.from(JSON.stringify(input), "utf8").toString("base64url");
}

function decodeState(value: string) {
  return stateSchema.parse(JSON.parse(Buffer.from(value, "base64url").toString("utf8")));
}

function authPayload(user: { id: string; email: string }, membership: { organizationId: string; role: string }) {
  return {
    id: user.id,
    email: user.email,
    organizationId: membership.organizationId,
    role: membership.role,
  };
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

async function getSendQuota(organizationId: string, userId: string) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: { subscription: true },
  });
  const plan = organization?.subscription?.plan ?? organization?.plan ?? "free";
  const isFree = plan === "free";
  const limit = isFree ? env.FREE_DAILY_SEND_LIMIT : 10_000;
  const used = await prisma.usageEvent.aggregate({
    where: {
      organizationId,
      userId,
      key: "email.sent",
      createdAt: { gte: startOfToday() },
    },
    _sum: { quantity: true },
  });
  const sentToday = used._sum.quantity ?? 0;
  return {
    plan,
    limit,
    sentToday,
    remaining: Math.max(0, limit - sentToday),
    limited: isFree,
  };
}

async function enforceSendQuota(organizationId: string, userId: string) {
  const quota = await getSendQuota(organizationId, userId);
  if (quota.remaining <= 0) {
    const error = new Error(`Daily free send limit reached (${quota.sentToday}/${quota.limit}). Upgrade to send more today.`);
    Object.assign(error, { statusCode: 429, quota });
    throw error;
  }
  return quota;
}

app.get("/health", async (_req, res) => {
  await prisma.$queryRaw`select 1`;
  res.json({ ok: true, service: "neuromail-api", ai: Boolean(env.GEMINI_API_KEY) });
});

app.post("/auth/register", async (req, res) => {
  const body = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    organizationName: z.string().min(2).optional(),
  }).parse(req.body);

  const passwordHash = await bcrypt.hash(body.password, 12);
  const slug = (body.organizationName ?? `${body.name}'s Workspace`).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      passwordHash,
      memberships: {
        create: {
          role: "OWNER",
          organization: {
            create: {
              name: body.organizationName ?? `${body.name}'s Workspace`,
              slug: `${slug}-${Date.now()}`,
              workspaces: { create: { name: "Main Workspace", slug: "main" } },
              subscription: { create: { plan: "free", status: "TRIALING" } },
            },
          },
        },
      },
    },
    include: { memberships: { include: { organization: { include: { workspaces: true } } } } },
  });
  const membership = user.memberships[0];
  const token = signSession(authPayload(user, membership), env.JWT_SECRET);
  res.status(201).json({ token, user, organization: membership.organization, workspace: membership.organization.workspaces[0] });
});

app.post("/auth/login", async (req, res) => {
  const body = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user?.passwordHash || !await bcrypt.compare(body.password, user.passwordHash)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const membership = await prisma.membership.findFirstOrThrow({
    where: { userId: user.id },
    include: { organization: { include: { workspaces: true } } },
  });
  const token = signSession(authPayload(user, membership), env.JWT_SECRET);
  res.json({ token, user, organization: membership.organization, workspace: membership.organization.workspaces[0] });
});

app.post("/auth/dev-login", async (_req, res) => {
  const user = await prisma.user.findUnique({ where: { email: "alex@neuromail.ai" } });
  const membership = user ? await prisma.membership.findFirst({
    where: { userId: user.id },
    include: { organization: { include: { workspaces: true } } },
  }) : null;
  if (!user || !membership) {
    res.status(404).json({ error: "Run prisma seed first" });
    return;
  }

  const token = signSession(authPayload(user, membership), env.JWT_SECRET);
  res.json({ token, user, organization: membership.organization, workspace: membership.organization.workspaces[0] });
});

app.get(["/auth/google/url", "/api/auth/google/url"], requireAuth(env.JWT_SECRET), async (req, res) => {
  const workspaceId = z.string().parse(req.query.workspaceId);
  res.json({ url: gmailAuthUrl(env, encodeState({ userId: req.user!.id, workspaceId, returnTo: `${env.WEB_URL}/app/settings` })) });
});

app.get(["/auth/google/callback", "/api/auth/google/callback"], async (req, res) => {
  const code = z.string().parse(req.query.code);
  const state = decodeState(z.string().parse(req.query.state));
  const account = await connectGmailAccount({ prisma, env, code, workspaceId: state.workspaceId });
  await prisma.auditLog.create({
    data: {
      organizationId: (await prisma.workspace.findUniqueOrThrow({ where: { id: state.workspaceId } })).organizationId,
      actorUserId: state.userId,
      action: "gmail.connected",
      entityType: "EmailAccount",
      entityId: account.id,
      metadata: { email: account.email },
    },
  });
  res.redirect(state.returnTo ?? `${env.WEB_URL}/app/settings?connected=gmail`);
});

app.get(["/auth/microsoft/url", "/api/auth/microsoft/url"], requireAuth(env.JWT_SECRET), async (req, res) => {
  const workspaceId = z.string().parse(req.query.workspaceId);
  res.json({ url: microsoftAuthUrl(env, encodeState({ userId: req.user!.id, workspaceId, returnTo: `${env.WEB_URL}/app/settings` })) });
});

app.get(["/auth/microsoft/callback", "/api/auth/microsoft/callback"], async (req, res) => {
  const code = z.string().parse(req.query.code);
  const state = decodeState(z.string().parse(req.query.state));
  const account = await connectOutlookAccount({ prisma, env, code, workspaceId: state.workspaceId });
  await prisma.auditLog.create({
    data: {
      organizationId: (await prisma.workspace.findUniqueOrThrow({ where: { id: state.workspaceId } })).organizationId,
      actorUserId: state.userId,
      action: "outlook.connected",
      entityType: "EmailAccount",
      entityId: account.id,
      metadata: { email: account.email },
    },
  });
  res.redirect(state.returnTo ?? `${env.WEB_URL}/app/settings?connected=outlook`);
});

app.get("/me", requireAuth(env.JWT_SECRET), async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.user!.id },
    include: { memberships: { include: { organization: { include: { workspaces: true, subscription: true } } } } },
  });
  res.json({ data: user });
});

app.get("/usage/quota", requireAuth(env.JWT_SECRET), async (req, res) => {
  const quota = await getSendQuota(req.user!.organizationId!, req.user!.id);
  res.json({ data: quota });
});

app.get("/workspaces/:workspaceId/emails", requireAuth(env.JWT_SECRET), async (req, res) => {
  const query = paginationSchema.parse(req.query);
  const workspaceId = String(req.params.workspaceId);
  const emails = await prisma.email.findMany({
    where: {
      account: { workspaceId },
      isArchived: false,
    },
    orderBy: { receivedAt: "desc" },
    take: query.limit,
    include: { attachments: true, thread: true, account: true },
  });
  res.json({ data: emails });
});

app.get("/workspaces/:workspaceId/accounts", requireAuth(env.JWT_SECRET), async (req, res) => {
  const accounts = await prisma.emailAccount.findMany({
    where: { workspaceId: String(req.params.workspaceId) },
    select: { id: true, provider: true, email: true, displayName: true, lastSyncedAt: true, connectedAt: true },
  });
  res.json({ data: accounts });
});

app.get("/workspaces/:workspaceId/automations", requireAuth(env.JWT_SECRET), async (req, res) => {
  const automations = await prisma.workflowAutomation.findMany({
    where: { workspaceId: String(req.params.workspaceId) },
    orderBy: { createdAt: "desc" },
  });
  res.json({ data: automations });
});

app.post("/workspaces/:workspaceId/drafts", requireAuth(env.JWT_SECRET), async (req, res) => {
  const body = z.object({
    to: z.string().email().optional(),
    subject: z.string().min(1),
    body: z.string().min(1),
  }).parse(req.body);
  const workspaceId = String(req.params.workspaceId);
  let account = await prisma.emailAccount.findFirst({ where: { workspaceId } });
  if (!account) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
    account = await prisma.emailAccount.create({
      data: {
        workspaceId,
        provider: "IMAP_SMTP",
        email: user.email,
        displayName: user.name,
      },
    });
  }
  const thread = await prisma.emailThread.create({
    data: { workspaceId, subject: body.subject },
  });
  const email = await prisma.email.create({
    data: {
      threadId: thread.id,
      accountId: account.id,
      senderUserId: req.user!.id,
      fromName: "Alex Carter",
      fromEmail: account.email,
      to: body.to ? [{ email: body.to }] : [],
      subject: body.subject,
      preview: body.body.slice(0, 160),
      bodyText: body.body,
      labels: ["Draft"],
      isRead: true,
      aiSummary: "Saved AI-generated draft.",
      aiActions: ["Send", "Schedule follow-up"],
    },
  });
  res.status(201).json({ data: email });
});

app.patch("/emails/:emailId", requireAuth(env.JWT_SECRET), async (req, res) => {
  const emailId = String(req.params.emailId);
  const body = z.object({
    isRead: z.boolean().optional(),
    isStarred: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    labels: z.array(z.string()).optional(),
  }).parse(req.body);
  const email = await prisma.email.update({ where: { id: emailId }, data: body });
  io.emit("email.updated", email);
  res.json({ data: email });
});

app.post("/email-accounts/:accountId/sync", requireAuth(env.JWT_SECRET), async (req, res) => {
  const account = await prisma.emailAccount.findUniqueOrThrow({ where: { id: String(req.params.accountId) } });
  const saved = account.provider === "GMAIL"
    ? await syncGmailInbox({ prisma, accountId: account.id, env, maxResults: 20 })
    : account.provider === "OUTLOOK"
      ? await syncOutlookInbox({ prisma, accountId: account.id, env })
      : [];
  io.emit("email.synced", { accountId: account.id, count: saved.length });
  res.json({ data: saved, count: saved.length });
});

app.post("/email-accounts/:accountId/send", requireAuth(env.JWT_SECRET), async (req, res) => {
  const accountId = String(req.params.accountId);
  const body = z.object({
    to: z.string().email(),
    subject: z.string().min(1),
    body: z.string().min(1),
  }).parse(req.body);
  const account = await prisma.emailAccount.findUniqueOrThrow({ where: { id: accountId } });
  let quota;
  try {
    quota = await enforceSendQuota(req.user!.organizationId!, req.user!.id);
  } catch (error) {
    const err = error as Error & { statusCode?: number; quota?: unknown };
    res.status(err.statusCode ?? 500).json({ error: err.message, quota: err.quota });
    return;
  }
  if (account.provider === "GMAIL") {
    await sendGmailMessage({ prisma, accountId, env, ...body });
  } else if (account.provider === "OUTLOOK") {
    await sendOutlookMessage({ prisma, accountId, env, ...body });
  } else {
    await sendSmtpMessage(env, body);
  }
  await prisma.usageEvent.create({
    data: {
      organizationId: req.user!.organizationId!,
      userId: req.user!.id,
      key: "email.sent",
      quantity: 1,
      metadata: { provider: account.provider, to: body.to },
    },
  });
  res.json({ ok: true, quota: { ...quota, sentToday: quota.sentToday + 1, remaining: Math.max(0, quota.remaining - 1) } });
});

app.post("/imap/sync", requireAuth(env.JWT_SECRET), async (req, res) => {
  const body = z.object({ workspaceId: z.string() }).parse(req.body);
  const saved = await syncImapInbox({ prisma, workspaceId: body.workspaceId, env });
  res.json({ data: saved, count: saved.length });
});

app.post("/smtp/send", requireAuth(env.JWT_SECRET), async (req, res) => {
  const body = z.object({
    to: z.string().email(),
    subject: z.string().min(1),
    body: z.string().min(1),
  }).parse(req.body);
  let quota;
  try {
    quota = await enforceSendQuota(req.user!.organizationId!, req.user!.id);
  } catch (error) {
    const err = error as Error & { statusCode?: number; quota?: unknown };
    res.status(err.statusCode ?? 500).json({ error: err.message, quota: err.quota });
    return;
  }
  await sendSmtpMessage(env, body);
  await prisma.usageEvent.create({
    data: {
      organizationId: req.user!.organizationId!,
      userId: req.user!.id,
      key: "email.sent",
      quantity: 1,
      metadata: { provider: "SMTP", to: body.to },
    },
  });
  res.json({ ok: true, quota: { ...quota, sentToday: quota.sentToday + 1, remaining: Math.max(0, quota.remaining - 1) } });
});

app.post("/attachments/presign-upload", requireAuth(env.JWT_SECRET), async (req, res) => {
  const body = z.object({
    fileName: z.string().min(1),
    contentType: z.string().min(1),
    sizeBytes: z.number().int().positive(),
    emailId: z.string().optional(),
  }).parse(req.body);
  const key = `attachments/${req.user!.organizationId}/${Date.now()}-${body.fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const uploadUrl = await createAttachmentUploadUrl(env, { key, contentType: body.contentType });
  const attachment = body.emailId ? await prisma.attachment.create({
    data: {
      emailId: body.emailId,
      fileName: body.fileName,
      mimeType: body.contentType,
      sizeBytes: body.sizeBytes,
      storageKey: key,
    },
  }) : null;
  res.json({ data: { uploadUrl, key, attachment } });
});

app.get("/attachments/:attachmentId/download", requireAuth(env.JWT_SECRET), async (req, res) => {
  const attachment = await prisma.attachment.findUniqueOrThrow({ where: { id: String(req.params.attachmentId) } });
  const url = await createAttachmentDownloadUrl(env, attachment.storageKey);
  res.json({ data: { url } });
});

app.post("/billing/checkout", requireAuth(env.JWT_SECRET), async (req, res) => {
  const body = z.object({
    plan: z.enum(["pro", "team"]).default("pro"),
    successUrl: z.string().url(),
    cancelUrl: z.string().url(),
  }).parse(req.body);
  const priceId = body.plan === "team" ? env.STRIPE_PRICE_TEAM : env.STRIPE_PRICE_PRO;
  if (!priceId) {
    res.status(400).json({ error: `Stripe price is not configured for ${body.plan}` });
    return;
  }
  const session = await createCheckoutSession({
    prisma,
    stripeSecretKey: env.STRIPE_SECRET_KEY,
    priceId,
    organizationId: req.user!.organizationId!,
    successUrl: body.successUrl,
    cancelUrl: body.cancelUrl,
  });
  res.json({ data: { url: session.url, id: session.id } });
});

app.post("/ai/draft", requireAuth(env.JWT_SECRET), async (req, res) => {
  const body = aiDraftSchema.parse(req.body);
  const result = await generateWithGemini({
    apiKey: env.GEMINI_API_KEY,
    model: env.GEMINI_MODEL,
    prompt: emailPrompt("draft", JSON.stringify(body, null, 2)),
    fallback: `Hi,\n\n${body.intent}\n\nBest,\nAlex`,
  });

  await prisma.aiGeneration.create({
    data: {
      userId: req.user!.id,
      type: "DRAFT",
      model: result.model,
      prompt: body.intent,
      output: result.text,
      latencyMs: result.latencyMs,
    },
  });

  res.json({ data: result });
});

app.post("/ai/reply", requireAuth(env.JWT_SECRET), async (req, res) => {
  const body = aiReplySchema.parse(req.body);
  const email = await prisma.email.findUniqueOrThrow({ where: { id: body.emailId } });
  const result = await generateWithGemini({
    apiKey: env.GEMINI_API_KEY,
    model: env.GEMINI_MODEL,
    prompt: emailPrompt("reply", `Tone: ${body.tone}\nSubject: ${email.subject}\nBody:\n${email.bodyText}`),
    fallback: `Hi ${email.fromName.split(" ")[0]},\n\nThanks for the context. I will review this and follow up shortly.\n\nBest,\nAlex`,
  });

  await prisma.aiGeneration.create({
    data: {
      userId: req.user!.id,
      emailId: email.id,
      type: "REPLY",
      model: result.model,
      prompt: email.bodyText,
      output: result.text,
      latencyMs: result.latencyMs,
    },
  });

  res.json({ data: result });
});

app.post("/workspaces/:workspaceId/automations", requireAuth(env.JWT_SECRET), async (req, res) => {
  const body = createAutomationSchema.parse({ ...req.body, workspaceId: String(req.params.workspaceId) });
  const automation = await prisma.workflowAutomation.create({
    data: {
      workspaceId: body.workspaceId,
      name: body.name,
      trigger: body.trigger as Prisma.InputJsonValue,
      actions: body.actions as Prisma.InputJsonValue,
    },
  });
  res.status(201).json({ data: automation });
});

app.post("/jobs/sync-email", requireAuth(env.JWT_SECRET), async (req, res) => {
  const job = await aiQueue.add("sync-email", { requestedBy: req.user!.id, ...req.body });
  res.status(202).json({ jobId: job.id });
});

app.post("/graphql", async (req, res) => {
  const query = String(req.body?.query ?? "");
  if (query.includes("viewer")) {
    res.json({ data: { viewer: { product: "NeuroMail AI", status: "ready" } } });
    return;
  }
  res.status(400).json({ errors: [{ message: "Only viewer query is enabled in the starter GraphQL gateway." }] });
});

io.on("connection", (socket) => {
  socket.emit("connected", { service: "neuromail-realtime" });
});

const port = Number(process.env.PORT ?? 4000);
httpServer.listen(port, () => {
  console.log(`NeuroMail API listening on http://localhost:${port}`);
});
