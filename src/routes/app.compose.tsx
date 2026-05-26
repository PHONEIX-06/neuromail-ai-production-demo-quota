import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Send, Wand2, Paperclip, Image as ImageIcon, Mic } from "lucide-react";
import { apiPost, getConnectedAccounts, getSendQuota, loadStoredEmails, saveStoredEmails, sendViaConnectedAccount, type EmailAccount, type SendQuota } from "@/lib/api";
import { type Email } from "@/lib/mock-data";

export const Route = createFileRoute("/app/compose")({
  component: Compose,
});

const tones = ["Professional", "Friendly", "Concise", "Persuasive", "Empathetic", "Direct"];
const presets = [
  { title: "Cold outreach", desc: "Warm intro to a prospect", intent: "Write a warm cold outreach email to introduce NeuroMail and ask for a short discovery call." },
  { title: "Follow-up nudge", desc: "Politely re-engage a stale thread", intent: "Follow up politely on an unanswered thread and ask if this is still a priority." },
  { title: "Decline gracefully", desc: "Say no without burning the bridge", intent: "Decline the request kindly, explain the reason briefly, and leave the door open." },
  { title: "Meeting request", desc: "Propose times and an agenda", intent: "Ask for a meeting, include a short agenda, and propose two time windows." },
  { title: "Status update", desc: "Async stakeholder update", intent: "Send a crisp project status update with progress, blockers, and next steps." },
  { title: "Thank you note", desc: "Specific, sincere appreciation", intent: "Write a sincere thank you note that mentions the specific help they gave." },
];

function Compose() {
  const [tone, setTone] = useState("Professional");
  const [length, setLength] = useState(50);
  const [to, setTo] = useState("marcus@acmecorp.io");
  const [subject, setSubject] = useState("Re: Onboarding - final questions before signing");
  const [intent, setIntent] = useState("Reply confirming EU data residency and SAML SSO timeline. Push to close Friday.");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [quota, setQuota] = useState<SendQuota | null>(null);
  const [generated, setGenerated] = useState(
    "Hi Marcus,\n\nThanks for the careful review. To address your two blockers head-on:\n\n1. Data residency - yes, we can pin all NeuroMail tenant storage to our Frankfurt region with no exceptions. I'll send the EU-only addendum this afternoon.\n\n2. SAML SSO - the GA release lands next Tuesday. I can have your IT admin set up in a 30-minute working session that day.\n\nIf both of those work, let's plan to counter-sign Friday EOD. Happy to jump on a call tomorrow if it speeds things up.\n\nBest,\nAlex"
  );
  const lengthLabel = length < 33 ? "Short" : length < 66 ? "Medium" : "Long";

  useEffect(() => {
    getConnectedAccounts().then(setAccounts);
    getSendQuota().then(setQuota);
  }, []);

  async function generateDraft() {
    if (!intent.trim()) {
      setStatus("Add an intent first");
      return;
    }
    setBusy(true);
    setStatus("Generating with Gemini...");
    const result = await apiPost<{ text: string }>("/api/ai/draft", { to, subject, intent, tone, length: lengthLabel }, { text: generated });
    setGenerated(result.text);
    setStatus("Draft generated");
    setBusy(false);
  }

  async function saveDraft(sent = false) {
    setBusy(true);
    setStatus(sent ? "Sending..." : "Saving...");
    if (sent) {
      try {
        const result = await sendViaConnectedAccount({ to, subject, body: generated });
        if (result.quota) setQuota(result.quota);
        setStatus(`Sent from ${result.account.email}`);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Send failed");
      } finally {
        setBusy(false);
      }
      return;
    }
    const fallback: Email = {
      id: `local-${Date.now()}`,
      from: { name: "Alex Carter", email: "alex@neuromail.ai" },
      subject,
      preview: generated.slice(0, 120),
      body: generated,
      time: "Just now",
      unread: false,
      starred: false,
      category: "Primary",
      priority: "normal",
      sentiment: "neutral",
      aiSummary: sent ? "Sent with AI compose." : "Saved AI draft.",
      aiActions: ["Follow up later", "Create reminder"],
    };
    const stored = await apiPost<Email>("/api/emails", { to, subject, body: generated, sent }, fallback);
    saveStoredEmails([stored, ...loadStoredEmails().filter((email) => email.id !== stored.id)]);
    setStatus("Draft stored");
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.2em] text-brand">AI Compose</div>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight md:text-4xl">Draft an email in seconds.</h1>
          <p className="mt-1 text-muted-foreground">Describe the intent. NeuroMail writes it in your voice.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="rounded-2xl glass p-5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">To</label>
            <input value={to} onChange={(event) => setTo(event.target.value)} className="mt-1 w-full bg-transparent text-sm outline-none" />
            <div className="mt-3 border-t border-border/60 pt-3">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Subject</label>
              <input value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-1 w-full bg-transparent text-sm outline-none" />
            </div>
          </div>

          <div className="rounded-2xl glass p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-brand">
              <Sparkles className="h-3.5 w-3.5" /> Intent prompt
            </div>
            <textarea
              value={intent}
              onChange={(event) => setIntent(event.target.value)}
              className="h-20 w-full resize-none rounded-lg border border-border/60 bg-background/40 p-3 text-sm focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button onClick={generateDraft} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-brand px-3.5 py-2 text-sm font-medium text-brand-foreground shadow-glow disabled:opacity-60">
                <Wand2 className="h-3.5 w-3.5" /> {busy ? "Working..." : "Generate draft"}
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-lg glass px-3 py-2 text-sm">
                <Mic className="h-3.5 w-3.5" /> Dictate
              </button>
              <span className="ml-auto text-xs text-muted-foreground">
                {status} - {quota ? `${quota.remaining}/${quota.limit} sends left today` : accounts[0] ? `sending as ${accounts[0].email}` : "connect mail in Settings"}
              </span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl glass-strong p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-brand" /> Generated draft
              </div>
              <div className="text-xs text-muted-foreground">~{generated.split(/\s+/).filter(Boolean).length} words</div>
            </div>
            <textarea
              value={generated}
              onChange={(event) => setGenerated(event.target.value)}
              className="h-72 w-full resize-none rounded-lg border border-border/60 bg-background/40 p-4 text-[15px] leading-relaxed focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-1.5 text-muted-foreground">
                <button className="grid h-8 w-8 place-items-center rounded-md hover:bg-surface-elevated transition"><Paperclip className="h-4 w-4" /></button>
                <button className="grid h-8 w-8 place-items-center rounded-md hover:bg-surface-elevated transition"><ImageIcon className="h-4 w-4" /></button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => saveDraft(false)} disabled={busy} className="rounded-lg glass px-3 py-2 text-sm disabled:opacity-60">Save draft</button>
                <button onClick={() => saveDraft(true)} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-brand px-3.5 py-2 text-sm font-medium text-brand-foreground shadow-glow disabled:opacity-60">
                  <Send className="h-3.5 w-3.5" /> Send
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl glass p-5">
            <div className="font-display text-base font-semibold">Tone</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {tones.map(t => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${tone === t ? "bg-gradient-brand text-brand-foreground" : "border border-border/60 hover:border-brand/40"}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">Length</span>
                <span className="text-muted-foreground">{lengthLabel}</span>
              </div>
              <input type="range" min={0} max={100} value={length} onChange={(event) => setLength(+event.target.value)} className="mt-2 w-full accent-[oklch(0.68_0.22_295)]" />
            </div>
          </div>

          <div className="rounded-2xl glass p-5">
            <div className="font-display text-base font-semibold">Quick presets</div>
            <div className="mt-3 space-y-2">
              {presets.map(p => (
                <button key={p.title} onClick={() => setIntent(p.intent)} className="w-full rounded-lg border border-border/60 bg-background/40 p-3 text-left transition hover:border-brand/40">
                  <div className="text-sm font-medium">{p.title}</div>
                  <div className="text-xs text-muted-foreground">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
