import "dotenv/config";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { readEnv } from "../../../packages/shared/src";
import { emailPrompt, generateWithGemini } from "../../api/src/ai";
import { syncGmailInbox } from "../../api/src/gmail";
import { syncOutlookInbox } from "../../api/src/outlook";

const env = readEnv(process.env);
const prisma = new PrismaClient();
const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });

const worker = new Worker("ai-jobs", async (job) => {
  if (job.name === "classify-email") {
    const email = await prisma.email.findUniqueOrThrow({ where: { id: job.data.emailId } });
    const result = await generateWithGemini({
      apiKey: env.GEMINI_API_KEY,
      model: env.GEMINI_MODEL,
      prompt: emailPrompt("classification", `${email.subject}\n\n${email.bodyText}`),
      fallback: JSON.stringify({ category: "Primary", priority: "NORMAL", sentiment: "NEUTRAL", phishingRisk: false }),
    });

    await prisma.aiGeneration.create({
      data: {
        userId: job.data.userId,
        emailId: email.id,
        type: "CLASSIFICATION",
        model: result.model,
        prompt: email.bodyText,
        output: result.text,
        latencyMs: result.latencyMs,
      },
    });

    return result;
  }

  if (job.name === "sync-email") {
    const account = await prisma.emailAccount.findUniqueOrThrow({ where: { id: job.data.accountId } });
    if (account.provider === "GMAIL") {
      const saved = await syncGmailInbox({ prisma, accountId: account.id, env, maxResults: job.data.maxResults ?? 20 });
      return { ok: true, provider: "GMAIL", count: saved.length };
    }
    if (account.provider === "OUTLOOK") {
      const saved = await syncOutlookInbox({ prisma, accountId: account.id, env });
      return { ok: true, provider: "OUTLOOK", count: saved.length };
    }
    return { ok: true, provider: account.provider, count: 0 };
  }

  return { ok: true };
}, { connection });

worker.on("completed", (job) => {
  console.log(`Worker completed ${job.name}:${job.id}`);
});

worker.on("failed", (job, error) => {
  console.error(`Worker failed ${job?.name}:${job?.id}`, error);
});
