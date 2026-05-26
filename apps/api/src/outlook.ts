import type { PrismaClient } from "@prisma/client";
import { encryptSecret, decryptSecret } from "./crypto";

export function microsoftAuthUrl(env: {
  MICROSOFT_CLIENT_ID?: string;
  MICROSOFT_REDIRECT_URI?: string;
}, state: string) {
  const params = new URLSearchParams({
    client_id: env.MICROSOFT_CLIENT_ID ?? "",
    response_type: "code",
    redirect_uri: env.MICROSOFT_REDIRECT_URI ?? "",
    response_mode: "query",
    scope: "offline_access openid email profile Mail.Read Mail.Send",
    state,
  });
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;
}

export async function connectOutlookAccount(options: {
  prisma: PrismaClient;
  env: {
    MICROSOFT_CLIENT_ID?: string;
    MICROSOFT_CLIENT_SECRET?: string;
    MICROSOFT_REDIRECT_URI?: string;
    ENCRYPTION_KEY?: string;
  };
  code: string;
  workspaceId: string;
}) {
  const body = new URLSearchParams({
    client_id: options.env.MICROSOFT_CLIENT_ID ?? "",
    client_secret: options.env.MICROSOFT_CLIENT_SECRET ?? "",
    code: options.code,
    redirect_uri: options.env.MICROSOFT_REDIRECT_URI ?? "",
    grant_type: "authorization_code",
  });
  const tokenResponse = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!tokenResponse.ok) throw new Error("Microsoft token exchange failed");
  const tokens = await tokenResponse.json() as { access_token: string; refresh_token?: string };
  const meResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { authorization: `Bearer ${tokens.access_token}` },
  });
  if (!meResponse.ok) throw new Error("Microsoft profile lookup failed");
  const me = await meResponse.json() as { mail?: string; userPrincipalName?: string; displayName?: string };
  const email = me.mail ?? me.userPrincipalName;
  if (!email) throw new Error("Microsoft account did not return an email address");
  const key = options.env.ENCRYPTION_KEY ?? "development-secret-change-me";

  return options.prisma.emailAccount.upsert({
    where: { workspaceId_email: { workspaceId: options.workspaceId, email } },
    update: {
      provider: "OUTLOOK",
      displayName: me.displayName,
      accessTokenEnc: encryptSecret(tokens.access_token, key),
      refreshTokenEnc: tokens.refresh_token ? encryptSecret(tokens.refresh_token, key) : undefined,
      connectedAt: new Date(),
    },
    create: {
      workspaceId: options.workspaceId,
      provider: "OUTLOOK",
      email,
      displayName: me.displayName,
      accessTokenEnc: encryptSecret(tokens.access_token, key),
      refreshTokenEnc: tokens.refresh_token ? encryptSecret(tokens.refresh_token, key) : undefined,
    },
  });
}

export async function syncOutlookInbox(options: {
  prisma: PrismaClient;
  accountId: string;
  env: { ENCRYPTION_KEY?: string };
}) {
  const account = await options.prisma.emailAccount.findUniqueOrThrow({ where: { id: options.accountId } });
  const token = decryptSecret(account.accessTokenEnc, options.env.ENCRYPTION_KEY ?? "development-secret-change-me");
  const response = await fetch("https://graph.microsoft.com/v1.0/me/messages?$top=10&$orderby=receivedDateTime desc", {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Microsoft Graph inbox sync failed");
  const payload = await response.json() as { value?: any[] };
  const saved = [];

  for (const item of payload.value ?? []) {
    const existing = await options.prisma.email.findFirst({ where: { accountId: account.id, externalId: item.id } });
    if (existing) continue;
    const thread = await options.prisma.emailThread.create({
      data: {
        workspaceId: account.workspaceId,
        subject: item.subject || "(no subject)",
        externalId: item.conversationId,
      },
    });
    saved.push(await options.prisma.email.create({
      data: {
        threadId: thread.id,
        accountId: account.id,
        externalId: item.id,
        fromName: item.from?.emailAddress?.name ?? item.from?.emailAddress?.address ?? "Unknown",
        fromEmail: item.from?.emailAddress?.address ?? "unknown@example.com",
        to: item.toRecipients ?? [],
        subject: item.subject || "(no subject)",
        preview: item.bodyPreview ?? "",
        bodyText: item.bodyPreview ?? "",
        bodyHtml: item.body?.contentType === "html" ? item.body?.content : undefined,
        isRead: Boolean(item.isRead),
        receivedAt: item.receivedDateTime ? new Date(item.receivedDateTime) : new Date(),
      },
    }));
  }
  return saved;
}

export async function sendOutlookMessage(options: {
  prisma: PrismaClient;
  accountId: string;
  env: { ENCRYPTION_KEY?: string };
  to: string;
  subject: string;
  body: string;
}) {
  const account = await options.prisma.emailAccount.findUniqueOrThrow({ where: { id: options.accountId } });
  const token = decryptSecret(account.accessTokenEnc, options.env.ENCRYPTION_KEY ?? "development-secret-change-me");
  const response = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      message: {
        subject: options.subject,
        body: { contentType: "Text", content: options.body },
        toRecipients: [{ emailAddress: { address: options.to } }],
      },
      saveToSentItems: true,
    }),
  });
  if (!response.ok) throw new Error("Microsoft Graph sendMail failed");
}
