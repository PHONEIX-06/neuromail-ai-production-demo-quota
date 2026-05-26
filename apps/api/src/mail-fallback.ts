import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";
import type { PrismaClient } from "@prisma/client";

export async function sendSmtpMessage(env: {
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
  SMTP_FROM?: string;
}, message: { to: string; subject: string; body: string }) {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) {
    throw new Error("SMTP is not configured");
  }
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: (env.SMTP_PORT ?? 587) === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
  });
  return transporter.sendMail({
    from: env.SMTP_FROM ?? env.SMTP_USER,
    to: message.to,
    subject: message.subject,
    text: message.body,
  });
}

export async function syncImapInbox(options: {
  prisma: PrismaClient;
  workspaceId: string;
  env: {
    IMAP_HOST?: string;
    IMAP_PORT?: number;
    IMAP_USER?: string;
    IMAP_PASSWORD?: string;
  };
}) {
  if (!options.env.IMAP_HOST || !options.env.IMAP_USER || !options.env.IMAP_PASSWORD) {
    throw new Error("IMAP is not configured");
  }

  const client = new ImapFlow({
    host: options.env.IMAP_HOST,
    port: options.env.IMAP_PORT ?? 993,
    secure: true,
    auth: { user: options.env.IMAP_USER, pass: options.env.IMAP_PASSWORD },
  });

  await client.connect();
  const lock = await client.getMailboxLock("INBOX");
  const saved = [];
  try {
    const account = await options.prisma.emailAccount.upsert({
      where: { workspaceId_email: { workspaceId: options.workspaceId, email: options.env.IMAP_USER } },
      update: { provider: "IMAP_SMTP", connectedAt: new Date() },
      create: {
        workspaceId: options.workspaceId,
        provider: "IMAP_SMTP",
        email: options.env.IMAP_USER,
        displayName: options.env.IMAP_USER,
      },
    });

    for await (const message of client.fetch("1:*", { envelope: true, source: true, uid: true }, { uid: false })) {
      if (saved.length >= 10) break;
      if (!message.envelope) continue;
      const externalId = `imap-${message.uid}`;
      const existing = await options.prisma.email.findFirst({ where: { accountId: account.id, externalId } });
      if (existing) continue;
      const subject = message.envelope.subject || "(no subject)";
      const thread = await options.prisma.emailThread.create({
        data: { workspaceId: options.workspaceId, subject, externalId },
      });
      const from = message.envelope.from?.[0];
      saved.push(await options.prisma.email.create({
        data: {
          accountId: account.id,
          threadId: thread.id,
          externalId,
          fromName: from?.name ?? from?.address ?? "Unknown",
          fromEmail: from?.address ?? "unknown@example.com",
          to: (message.envelope.to ?? []).map((item) => ({ name: item.name, email: item.address })),
          subject,
          preview: subject,
          bodyText: message.source?.toString("utf8").slice(0, 8000) ?? "",
          receivedAt: message.envelope.date ?? new Date(),
        },
      }));
    }
  } finally {
    lock.release();
    await client.logout();
  }
  return saved;
}
