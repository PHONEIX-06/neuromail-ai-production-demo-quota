import { emails, type Email } from "./mock-data";

export type Automation = {
  id: string;
  name: string;
  trigger: string;
  action: string;
  runs: number;
  on: boolean;
  icon: "forward" | "bell" | "zap" | "tag" | "bot";
};

export type DraftRequest = {
  to?: string;
  subject?: string;
  intent: string;
  tone: string;
  length: "Short" | "Medium" | "Long";
};

export type ReplyRequest = {
  email: Email;
  tone: string;
};

export const defaultAutomations: Automation[] = [
  { id: "a1", name: "Auto-route invoices", trigger: "Subject contains 'invoice'", action: "Forward to finance@ + label AP", runs: 142, on: true, icon: "forward" },
  { id: "a2", name: "Hot lead alerts", trigger: "Sender in CRM 'Hot Leads'", action: "Notify on Slack + draft reply", runs: 38, on: true, icon: "bell" },
  { id: "a3", name: "Churn early warning", trigger: "Sentiment < -0.4 + Customer", action: "Page on-call + empathetic draft", runs: 6, on: true, icon: "zap" },
  { id: "a4", name: "Newsletter triage", trigger: "Category = Newsletter", action: "Summarize weekly digest", runs: 412, on: false, icon: "tag" },
  { id: "a5", name: "Meeting extractor", trigger: "Body contains 'let's meet'", action: "Suggest calendar slot", runs: 73, on: true, icon: "bot" },
];

const storageKeys = {
  emails: "neuromail.emails.v1",
  automations: "neuromail.automations.v1",
  session: "neuromail.session.v1",
};

type ApiSession = {
  token: string;
  workspace?: { id: string };
};

const apiBase = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export type EmailAccount = {
  id: string;
  provider: "GMAIL" | "OUTLOOK" | "IMAP_SMTP";
  email: string;
  displayName?: string | null;
  connectedAt?: string;
  lastSyncedAt?: string | null;
};

export type SendQuota = {
  plan: string;
  limit: number;
  sentToday: number;
  remaining: number;
  limited: boolean;
};

export function isProductionApiEnabled() {
  return Boolean(apiBase);
}

export function loadStoredEmails(): Email[] {
  return loadStored(storageKeys.emails, emails);
}

export function saveStoredEmails(next: Email[]) {
  saveStored(storageKeys.emails, next);
}

export function loadStoredAutomations(): Automation[] {
  return loadStored(storageKeys.automations, defaultAutomations);
}

export function saveStoredAutomations(next: Automation[]) {
  saveStored(storageKeys.automations, next);
}

function loadStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveStored<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export async function apiGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const request = await buildRequest(path);
    const response = await fetch(request.url, request.init);
    if (!response.ok) return fallback;
    return normalizeResponse(path, await response.json()) as T;
  } catch {
    return fallback;
  }
}

export async function apiPost<T>(path: string, body: unknown, fallback: T): Promise<T> {
  try {
    const normalizedBody = await normalizeRequestBody(path, body);
    const request = await buildRequest(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(normalizedBody),
    });
    const response = await fetch(request.url, request.init);
    if (!response.ok) return fallback;
    return normalizeResponse(path, await response.json()) as T;
  } catch {
    return fallback;
  }
}

export async function apiPatch<T>(path: string, body: unknown, fallback: T): Promise<T> {
  try {
    const request = await buildRequest(path, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const response = await fetch(request.url, request.init);
    if (!response.ok) return fallback;
    return normalizeResponse(path, await response.json()) as T;
  } catch {
    return fallback;
  }
}

export async function getConnectedAccounts(): Promise<EmailAccount[]> {
  if (!apiBase) return [];
  try {
    const session = await ensureSession();
    if (!session.workspace?.id) return [];
    const response = await authorizedFetch(`/workspaces/${session.workspace.id}/accounts`, session);
    if (!response.ok) return [];
    const payload = await response.json() as { data: EmailAccount[] };
    return payload.data;
  } catch {
    return [];
  }
}

export async function getOAuthUrl(provider: "google" | "microsoft") {
  const session = await ensureSession();
  if (!session.workspace?.id) throw new Error("Workspace is not available");
  const response = await authorizedFetch(`/auth/${provider}/url?workspaceId=${session.workspace.id}`, session);
  if (!response.ok) throw new Error(`Unable to create ${provider} OAuth URL`);
  const payload = await response.json() as { url: string };
  return payload.url;
}

export async function syncAccount(accountId: string) {
  const session = await ensureSession();
  const response = await authorizedFetch(`/email-accounts/${accountId}/sync`, session, { method: "POST" });
  if (!response.ok) throw new Error("Inbox sync failed");
  return response.json() as Promise<{ count: number; data: unknown[] }>;
}

export async function sendViaConnectedAccount(input: { to: string; subject: string; body: string }) {
  const accounts = await getConnectedAccounts();
  const account = accounts[0];
  if (!account) throw new Error("Connect Gmail, Outlook, or IMAP/SMTP before sending.");
  const session = await ensureSession();
  const response = await authorizedFetch(`/email-accounts/${account.id}/send`, session, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await response.json().catch(() => ({})) as { error?: string; quota?: SendQuota };
  if (!response.ok) throw new Error(payload.error ?? "Email send failed");
  return { account, quota: payload.quota };
}

export async function getSendQuota(): Promise<SendQuota | null> {
  if (!apiBase) return null;
  try {
    const session = await ensureSession();
    const response = await authorizedFetch("/usage/quota", session);
    if (!response.ok) return null;
    const payload = await response.json() as { data: SendQuota };
    return payload.data;
  } catch {
    return null;
  }
}

async function authorizedFetch(path: string, session: ApiSession, init: RequestInit = {}) {
  return fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      authorization: `Bearer ${session.token}`,
    },
  });
}

async function buildRequest(path: string, init: RequestInit = {}): Promise<{ url: string; init: RequestInit }> {
  if (!apiBase) return { url: path, init };
  const session = await ensureSession();
  const mappedPath = await mapPath(path, session, String(init.method ?? "GET"));
  return {
    url: `${apiBase}${mappedPath}`,
    init: {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        authorization: `Bearer ${session.token}`,
      },
    },
  };
}

async function ensureSession(): Promise<ApiSession> {
  const existing = loadStored<ApiSession | null>(storageKeys.session, null);
  if (existing?.token) return existing;
  const response = await fetch(`${apiBase}/auth/dev-login`, { method: "POST" });
  if (!response.ok) throw new Error("Unable to create API session");
  const session = await response.json() as ApiSession;
  saveStored(storageKeys.session, session);
  return session;
}

async function mapPath(path: string, session: ApiSession, method: string) {
  const workspaceId = session.workspace?.id;
  if (path === "/api/emails" && workspaceId && method.toUpperCase() === "POST") return `/workspaces/${workspaceId}/drafts`;
  if (path === "/api/emails" && workspaceId) return `/workspaces/${workspaceId}/emails`;
  if (path === "/api/automations" && workspaceId) return `/workspaces/${workspaceId}/automations`;
  if (path.startsWith("/api/ai/")) return path.replace("/api", "");
  return path.startsWith("/api/") ? path.replace("/api", "") : path;
}

async function normalizeRequestBody(path: string, body: unknown) {
  if (!apiBase) return body;
  if (path === "/api/automations" && body && typeof body === "object") {
    const item = body as { name?: string; trigger?: unknown; action?: unknown };
    return {
      name: item.name ?? "New automation",
      trigger: typeof item.trigger === "string" ? { text: item.trigger } : item.trigger,
      actions: typeof item.action === "string" ? [{ text: item.action }] : [{ text: "Draft suggested reply" }],
    };
  }
  if (path === "/api/emails" && body && typeof body === "object") {
    const item = body as { subject?: string; body?: string; to?: string };
    return { subject: item.subject, body: item.body, to: item.to };
  }
  if (path === "/api/ai/draft" && body && typeof body === "object") {
    const item = body as { tone?: string; length?: string };
    return {
      ...(body as Record<string, unknown>),
      tone: String(item.tone ?? "professional").toLowerCase(),
      length: String(item.length ?? "medium").toLowerCase(),
    };
  }
  if (path === "/api/ai/reply" && body && typeof body === "object") {
    const item = body as { email?: { id?: string }; tone?: string };
    return {
      emailId: item.email?.id,
      tone: String(item.tone ?? "professional").toLowerCase(),
    };
  }
  return body;
}

function normalizeResponse(path: string, payload: unknown): unknown {
  const data = payload && typeof payload === "object" && "data" in payload ? (payload as { data: unknown }).data : payload;
  if (path === "/api/emails" && Array.isArray(data)) return data.map(toUiEmail);
  if (path === "/api/automations" && Array.isArray(data)) return data.map(toUiAutomation);
  if (path === "/api/ai/draft" && data && typeof data === "object" && "text" in data) return { text: (data as { text: string }).text };
  return data;
}

function toUiEmail(email: any): Email {
  return {
    id: email.id,
    from: { name: email.fromName, email: email.fromEmail },
    subject: email.subject,
    preview: email.preview,
    body: email.bodyText,
    time: new Date(email.receivedAt ?? email.createdAt ?? Date.now()).toLocaleString(),
    unread: !email.isRead,
    starred: email.isStarred,
    category: (email.labels?.[0] ?? "Primary") as Email["category"],
    priority: String(email.priority ?? "NORMAL").toLowerCase() as Email["priority"],
    sentiment: String(email.sentiment ?? "NEUTRAL").toLowerCase() as Email["sentiment"],
    aiSummary: email.aiSummary ?? "No AI summary yet.",
    aiActions: email.aiActions ?? ["Generate reply", "Archive"],
    attachments: email.attachments?.map((attachment: any) => ({
      name: attachment.fileName,
      size: `${Math.ceil((attachment.sizeBytes ?? 0) / 1024)} KB`,
    })),
  };
}

function toUiAutomation(item: any): Automation {
  return {
    id: item.id,
    name: item.name,
    trigger: JSON.stringify(item.trigger),
    action: JSON.stringify(item.actions),
    runs: item.runCount ?? 0,
    on: item.enabled,
    icon: "bot",
  };
}
