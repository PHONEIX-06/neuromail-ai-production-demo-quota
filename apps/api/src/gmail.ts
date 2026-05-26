import { google } from "googleapis";
import type { PrismaClient } from "@prisma/client";
import { decryptSecret, encryptSecret } from "./crypto";

export function gmailOAuthClient(env: {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
}) {
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI,
  );
}

export function gmailAuthUrl(env: {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
}, state: string) {
  const client = gmailOAuthClient(env);
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    state,
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.modify",
    ],
  });
}

export async function connectGmailAccount(options: {
  prisma: PrismaClient;
  env: {
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    GOOGLE_REDIRECT_URI?: string;
    ENCRYPTION_KEY?: string;
  };
  code: string;
  workspaceId: string;
}) {
  const encryptionKey = options.env.ENCRYPTION_KEY ?? "development-secret-change-me";
  const client = gmailOAuthClient(options.env);
  const { tokens } = await client.getToken(options.code);
  client.setCredentials(tokens);

  const oauth2 = google.oauth2({ auth: client, version: "v2" });
  const profile = await oauth2.userinfo.get();
  const email = profile.data.email;
  if (!email) throw new Error("Google account did not return an email address");

  return options.prisma.emailAccount.upsert({
    where: { workspaceId_email: { workspaceId: options.workspaceId, email } },
    update: {
      provider: "GMAIL",
      displayName: profile.data.name,
      accessTokenEnc: tokens.access_token ? encryptSecret(tokens.access_token, encryptionKey) : undefined,
      refreshTokenEnc: tokens.refresh_token ? encryptSecret(tokens.refresh_token, encryptionKey) : undefined,
      connectedAt: new Date(),
    },
    create: {
      workspaceId: options.workspaceId,
      provider: "GMAIL",
      email,
      displayName: profile.data.name,
      accessTokenEnc: tokens.access_token ? encryptSecret(tokens.access_token, encryptionKey) : undefined,
      refreshTokenEnc: tokens.refresh_token ? encryptSecret(tokens.refresh_token, encryptionKey) : undefined,
    },
  });
}

export async function gmailClientForAccount(options: {
  account: { accessTokenEnc: string | null; refreshTokenEnc: string | null };
  env: {
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    GOOGLE_REDIRECT_URI?: string;
    ENCRYPTION_KEY?: string;
  };
}) {
  const encryptionKey = options.env.ENCRYPTION_KEY ?? "development-secret-change-me";
  const client = gmailOAuthClient(options.env);
  client.setCredentials({
    access_token: decryptSecret(options.account.accessTokenEnc, encryptionKey),
    refresh_token: decryptSecret(options.account.refreshTokenEnc, encryptionKey),
  });
  return google.gmail({ version: "v1", auth: client });
}

export async function syncGmailInbox(options: {
  prisma: PrismaClient;
  accountId: string;
  env: {
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    GOOGLE_REDIRECT_URI?: string;
    ENCRYPTION_KEY?: string;
  };
  maxResults?: number;
}) {
  const account = await options.prisma.emailAccount.findUniqueOrThrow({
    where: { id: options.accountId },
    include: { workspace: true },
  });
  const gmail = await gmailClientForAccount({ account, env: options.env });
  const listed = await gmail.users.messages.list({
    userId: "me",
    maxResults: options.maxResults ?? 10,
    q: "in:anywhere",
  });
  const messages = listed.data.messages ?? [];
  const saved = [];

  for (const messageRef of messages) {
    if (!messageRef.id) continue;
    const existing = await options.prisma.email.findFirst({ where: { externalId: messageRef.id, accountId: account.id } });
    if (existing) continue;

    const message = await gmail.users.messages.get({ userId: "me", id: messageRef.id, format: "full" });
    const headers = message.data.payload?.headers ?? [];
    const header = (name: string) => headers.find((item) => item.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
    const fromRaw = header("from");
    const subject = header("subject") || "(no subject)";
    const bodyText = extractText(message.data.payload) || message.data.snippet || "";
    const fromEmail = fromRaw.match(/<([^>]+)>/)?.[1] ?? fromRaw;
    const fromName = fromRaw.replace(/<[^>]+>/, "").replaceAll('"', "").trim() || fromEmail;

    const thread = await options.prisma.emailThread.upsert({
      where: { id: message.data.threadId ?? `gmail-${messageRef.id}` },
      update: { subject },
      create: {
        id: message.data.threadId ?? `gmail-${messageRef.id}`,
        workspaceId: account.workspaceId,
        subject,
        externalId: message.data.threadId,
      },
    });

    const savedEmail = await options.prisma.email.create({
      data: {
        threadId: thread.id,
        accountId: account.id,
        externalId: messageRef.id,
        fromName,
        fromEmail,
        to: [{ email: account.email }],
        subject,
        preview: message.data.snippet ?? bodyText.slice(0, 160),
        bodyText,
        labels: message.data.labelIds ?? [],
        isRead: !(message.data.labelIds ?? []).includes("UNREAD"),
        receivedAt: message.data.internalDate ? new Date(Number(message.data.internalDate)) : new Date(),
      },
    });
    saved.push(savedEmail);
  }

  await options.prisma.emailAccount.update({
    where: { id: account.id },
    data: { lastSyncedAt: new Date() },
  });

  return saved;
}

export async function sendGmailMessage(options: {
  prisma: PrismaClient;
  accountId: string;
  env: Parameters<typeof gmailClientForAccount>[0]["env"];
  to: string;
  subject: string;
  body: string;
}) {
  const account = await options.prisma.emailAccount.findUniqueOrThrow({ where: { id: options.accountId } });
  const gmail = await gmailClientForAccount({ account, env: options.env });
  const raw = Buffer.from([
    `To: ${options.to}`,
    `From: ${account.email}`,
    `Subject: ${options.subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    options.body,
  ].join("\r\n")).toString("base64url");

  return gmail.users.messages.send({ userId: "me", requestBody: { raw } });
}

function extractText(payload: any): string {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return Buffer.from(payload.body.data, "base64url").toString("utf8");
  }
  for (const part of payload.parts ?? []) {
    const text = extractText(part);
    if (text) return text;
  }
  return "";
}
