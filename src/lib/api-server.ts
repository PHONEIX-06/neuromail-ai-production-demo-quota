import { defaultAutomations, type Automation, type DraftRequest, type ReplyRequest } from "./api";
import { emails as seedEmails, type Email } from "./mock-data";

type RuntimeEnv = {
  GEMINI_API_KEY?: string;
};

let emailStore: Email[] = structuredClone(seedEmails);
let automationStore: Automation[] = structuredClone(defaultAutomations);

export async function handleApiRequest(request: Request, env: unknown): Promise<Response | undefined> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) return undefined;

  try {
    if (url.pathname === "/api/health") {
      return json({ ok: true, ai: Boolean(getGeminiKey(env)) });
    }

    if (url.pathname === "/api/emails" && request.method === "GET") {
      return json(emailStore);
    }

    if (url.pathname === "/api/emails" && request.method === "POST") {
      const body = await request.json() as Partial<Email>;
      const next: Email = {
        id: `sent-${Date.now()}`,
        from: { name: "Alex Carter", email: "alex@neuromail.ai" },
        subject: body.subject?.trim() || "Untitled draft",
        preview: (body.body ?? "").slice(0, 120),
        body: body.body ?? "",
        time: "Just now",
        unread: false,
        starred: false,
        category: "Primary",
        priority: "normal",
        sentiment: "neutral",
        aiSummary: "Sent with AI compose.",
        aiActions: ["Follow up later", "Create reminder"],
      };
      emailStore = [next, ...emailStore];
      return json(next, 201);
    }

    const emailId = url.pathname.match(/^\/api\/emails\/([^/]+)$/)?.[1];
    if (emailId && request.method === "PATCH") {
      const patch = await request.json() as Partial<Email>;
      emailStore = emailStore.map((email) => email.id === emailId ? { ...email, ...patch } : email);
      return json(emailStore.find((email) => email.id === emailId) ?? null);
    }

    if (emailId && request.method === "DELETE") {
      emailStore = emailStore.filter((email) => email.id !== emailId);
      return json({ ok: true });
    }

    if (url.pathname === "/api/automations" && request.method === "GET") {
      return json(automationStore);
    }

    if (url.pathname === "/api/automations" && request.method === "POST") {
      const body = await request.json() as Partial<Automation>;
      const next: Automation = {
        id: `a-${Date.now()}`,
        name: body.name?.trim() || "New automation",
        trigger: body.trigger?.trim() || "New inbound email",
        action: body.action?.trim() || "Draft a suggested reply",
        runs: 0,
        on: true,
        icon: body.icon ?? "bot",
      };
      automationStore = [next, ...automationStore];
      return json(next, 201);
    }

    const automationId = url.pathname.match(/^\/api\/automations\/([^/]+)$/)?.[1];
    if (automationId && request.method === "PATCH") {
      const patch = await request.json() as Partial<Automation>;
      automationStore = automationStore.map((item) => item.id === automationId ? { ...item, ...patch } : item);
      return json(automationStore.find((item) => item.id === automationId) ?? null);
    }

    if (automationId && request.method === "DELETE") {
      automationStore = automationStore.filter((item) => item.id !== automationId);
      return json({ ok: true });
    }

    if (url.pathname === "/api/ai/draft" && request.method === "POST") {
      const body = await request.json() as DraftRequest;
      const fallback = fallbackDraft(body);
      const text = await geminiText(env, [
        "You write excellent business emails. Return only the finished email body.",
        `Tone: ${body.tone}. Length: ${body.length}. Recipient: ${body.to || "unknown"}. Subject: ${body.subject || "unknown"}.`,
        `Intent: ${body.intent}`,
      ].join("\n"), fallback);
      return json({ text });
    }

    if (url.pathname === "/api/ai/reply" && request.method === "POST") {
      const body = await request.json() as ReplyRequest;
      const fallback = fallbackReply(body);
      const text = await geminiText(env, [
        "Draft a concise email reply. Return only the reply body.",
        `Tone: ${body.tone}.`,
        `Original sender: ${body.email.from.name} <${body.email.from.email}>`,
        `Subject: ${body.email.subject}`,
        `Email body:\n${body.email.body}`,
      ].join("\n"), fallback);
      return json({ text });
    }

    if (url.pathname === "/api/ai/ask" && request.method === "POST") {
      const { question } = await request.json() as { question: string };
      const corpus = emailStore.map((email) => `${email.from.name}: ${email.subject}\n${email.body}`).join("\n\n");
      const fallback = "I found the closest matching inbox items. Try asking about a sender, invoice, deadline, or specific thread.";
      const answer = await geminiText(env, `Answer this inbox question from the email data.\nQuestion: ${question}\n\nEmails:\n${corpus}`, fallback);
      return json({ answer });
    }

    return json({ error: "Not found" }, 404);
  } catch (error) {
    console.error(error);
    return json({ error: "API request failed" }, 500);
  }
}

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function geminiText(env: unknown, prompt: string, fallback: string): Promise<string> {
  const key = getGeminiKey(env);
  if (!key) return fallback;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 700 },
    }),
  });

  if (!response.ok) return fallback;
  const payload = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() || fallback;
}

function getGeminiKey(env: unknown): string | undefined {
  const runtimeEnv = env as RuntimeEnv | undefined;
  const processEnv = (globalThis as unknown as { process?: { env?: RuntimeEnv } }).process?.env;
  return runtimeEnv?.GEMINI_API_KEY || processEnv?.GEMINI_API_KEY;
}

function fallbackDraft(body: DraftRequest): string {
  return `Hi,\n\n${body.intent}\n\nI wanted to share this clearly and keep the next step simple. Please let me know what works best on your side, and I will follow up right away.\n\nBest,\nAlex`;
}

function fallbackReply({ email, tone }: ReplyRequest): string {
  return `Hi ${email.from.name.split(" ")[0]},\n\nThanks for the note. I understand the key points in your message and will move this forward in a ${tone.toLowerCase()} way.\n\nBest,\nAlex`;
}
