import { performance } from "node:perf_hooks";

type GeminiResult = {
  text: string;
  latencyMs: number;
  model: string;
};

export async function generateWithGemini(options: {
  apiKey?: string;
  model: string;
  prompt: string;
  fallback: string;
}): Promise<GeminiResult> {
  const started = performance.now();
  if (!options.apiKey) {
    return { text: options.fallback, latencyMs: Math.round(performance.now() - started), model: options.model };
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${options.model}:generateContent?key=${options.apiKey}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: options.prompt }] }],
        generationConfig: { temperature: 0.65, maxOutputTokens: 900 },
      }),
    });

    if (!response.ok) {
      return { text: options.fallback, latencyMs: Math.round(performance.now() - started), model: options.model };
    }

    const payload = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    return {
      text: text || options.fallback,
      latencyMs: Math.round(performance.now() - started),
      model: options.model,
    };
  } catch {
    return { text: options.fallback, latencyMs: Math.round(performance.now() - started), model: options.model };
  }
}

export function emailPrompt(kind: "draft" | "summary" | "classification" | "reply", context: string) {
  const system = {
    draft: "Write a polished business email. Return only the email body.",
    summary: "Summarize the email in one concise paragraph and list next actions.",
    classification: "Classify the email category, priority, sentiment, phishing risk, and reason as compact JSON.",
    reply: "Write a context-aware reply. Return only the reply body.",
  }[kind];

  return `${system}\n\nContext:\n${context}`;
}
