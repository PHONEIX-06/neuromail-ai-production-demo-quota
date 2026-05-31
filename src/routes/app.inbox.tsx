import { createFileRoute } from "@tanstack/react-router";
import { type ComponentType, type SVGProps, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Reply, Forward, Archive, Trash2, Sparkles, Bot, Paperclip,
  Filter, MoreHorizontal, Calendar, CheckCheck, RefreshCw,
} from "lucide-react";
import { emails as seedEmails, type Email, avatarColor, ini } from "@/lib/mock-data";
import { apiGet, apiPatch, apiPost, getConnectedAccounts, getSendQuota, loadStoredEmails, saveStoredEmails, sendViaConnectedAccount, syncAccount, type SendQuota } from "@/lib/api";

export const Route = createFileRoute("/app/inbox")({
  component: InboxPage,
});

function InboxPage() {
  const [items, setItems] = useState<Email[]>(() => loadStoredEmails());
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? seedEmails[0].id);
  const [filter, setFilter] = useState<string>("All");
  const [replyText, setReplyText] = useState("");
  const [replyTone, setReplyTone] = useState("Friendly");
  const [busy, setBusy] = useState(false);
  const [syncStatus, setSyncStatus] = useState("Ready");
  const [quota, setQuota] = useState<SendQuota | null>(null);

  useEffect(() => {
    apiGet<Email[]>("/api/emails", loadStoredEmails()).then((next) => {
      setItems(next);
      saveStoredEmails(next);
      setSelectedId((currentSelectedId) => currentSelectedId && next.some((email) => email.id === currentSelectedId)
        ? currentSelectedId
        : next[0]?.id ?? "");
    });
    getSendQuota().then(setQuota);
  }, []);

  useEffect(() => {
    saveStoredEmails(items);
  }, [items]);

  const filters = ["All", "Urgent", "Sales", "Internal", "Updates"];
  const list = useMemo(() => filter === "All"
    ? items
    : filter === "Urgent" ? items.filter((e) => e.priority === "urgent")
    : items.filter((e) => e.category === filter), [filter, items]);
  const selected = items.find((email) => email.id === selectedId) ?? list[0] ?? items[0] ?? seedEmails[0];

  useEffect(() => {
    setReplyText(`Hi ${selected.from.name.split(" ")[0]},\n\nThanks for the context. I will take a look and follow up with the next step shortly.\n\nBest,\nAlex`);
  }, [selected.id, selected.from.name]);

  async function updateEmail(id: string, patch: Partial<Email>) {
    setItems((current) => current.map((email) => email.id === id ? { ...email, ...patch } : email));
    await apiPatch(`/api/emails/${id}`, patch, null);
  }

  async function removeEmail(id: string) {
    const next = items.filter((email) => email.id !== id);
    setItems(next);
    setSelectedId(next[0]?.id ?? "");
    await fetch(`/api/emails/${id}`, { method: "DELETE" }).catch(() => undefined);
  }

  async function generateReply(tone = replyTone) {
    setBusy(true);
    setReplyTone(tone);
    const result = await apiPost<{ text: string }>("/api/ai/reply", { email: selected, tone }, { text: replyText });
    setReplyText(result.text);
    setBusy(false);
  }

  async function refreshInbox() {
    const next = await apiGet<Email[]>("/api/emails", loadStoredEmails());
    setItems(next);
    saveStoredEmails(next);
    if (!next.some((email) => email.id === selectedId)) setSelectedId(next[0]?.id ?? "");
    return next;
  }

  async function syncInbox() {
    setBusy(true);
    setSyncStatus("Syncing connected mailboxes...");
    try {
      const accounts = await getConnectedAccounts();
      if (!accounts.length) {
        setSyncStatus("Connect Gmail or Outlook in Settings first");
        return;
      }
      let count = 0;
      for (const account of accounts) {
        const result = await syncAccount(account.id);
        count += result.count ?? 0;
      }
      await refreshInbox();
      setSyncStatus(`Synced ${count} new messages`);
    } catch (error) {
      setSyncStatus(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setBusy(false);
    }
  }

  async function sendReply() {
    setBusy(true);
    try {
      const result = await sendViaConnectedAccount({
        to: selected.from.email,
        subject: selected.subject.startsWith("Re:") ? selected.subject : `Re: ${selected.subject}`,
        body: replyText,
      });
      if (result.quota) setQuota(result.quota);
      await updateEmail(selected.id, { unread: false });
      setSyncStatus(`Reply sent to ${selected.from.email}${result.quota ? ` - ${result.quota.remaining}/${result.quota.limit} sends left` : ""}`);
    } catch (error) {
      setSyncStatus(error instanceof Error ? error.message : "Reply send failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid h-[calc(100vh-4rem)] grid-cols-1 lg:grid-cols-[380px_1fr]">
      <div className="flex flex-col border-r border-border/60">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            <div className="font-display text-xl font-semibold">Inbox</div>
            <div className="text-xs text-muted-foreground">{list.length} conversations - {syncStatus}{quota ? ` - ${quota.remaining}/${quota.limit} sends left` : ""}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={syncInbox} disabled={busy} className="grid h-8 w-8 place-items-center rounded-lg glass disabled:opacity-60" title="Sync inbox">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button className="grid h-8 w-8 place-items-center rounded-lg glass">
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto px-4 py-3 scrollbar-thin">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition ${
                filter === f ? "bg-gradient-brand text-brand-foreground" : "glass text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-auto scrollbar-thin">
          {list.map(e => (
            <button
             key={e.id}
             onClick={() => {
               setSelectedId(e.id);
              if (e.unread) updateEmail(e.id, { unread: false });
              }}
              className={`group flex w-full gap-3 border-b border-border/40 px-4 py-3.5 text-left transition ${
                selected.id === e.id ? "bg-surface-elevated/80" : "hover:bg-surface-elevated/40"
              }`}
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-semibold text-white" style={{ background: avatarColor(e.from.name) }}>
                {ini(e.from.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`truncate text-sm ${e.unread ? "font-semibold" : "text-muted-foreground"}`}>{e.from.name}</span>
                  {e.priority === "urgent" && <span className="h-1.5 w-1.5 rounded-full bg-destructive" />}
                  <span className="ml-auto text-[11px] text-muted-foreground">{e.time}</span>
                </div>
                <div className={`mt-0.5 truncate text-sm ${e.unread ? "text-foreground" : "text-muted-foreground"}`}>{e.subject}</div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  {e.starred && <Star className="h-3 w-3 fill-warning text-warning" />}
                  {e.threadCount && <span className="rounded bg-muted px-1 text-[10px]">{e.threadCount}</span>}
                  <span className="line-clamp-1">{e.preview}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selected.id}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
          className="flex h-full flex-col overflow-hidden"
        >
          <div className="flex items-center gap-2 border-b border-border/60 px-6 py-3">
            <ToolBtn icon={Reply} label="Reply" onClick={() => generateReply(replyTone)} />
            <ToolBtn icon={Forward} label="Forward" />
            <ToolBtn icon={Archive} label="Archive" onClick={() => removeEmail(selected.id)} />
            <ToolBtn icon={Trash2} label="Delete" onClick={() => removeEmail(selected.id)} />
            <div className="ml-auto flex items-center gap-2">
              <ToolBtn icon={Star} label={selected.starred ? "Unstar" : "Star"} onClick={() => updateEmail(selected.id, { starred: !selected.starred })} />
              <ToolBtn icon={Calendar} label="Snooze" />
              <ToolBtn icon={MoreHorizontal} label="More" />
            </div>
          </div>

          <div className="flex-1 overflow-auto px-6 py-6 scrollbar-thin">
            <div className="mx-auto max-w-3xl">
              <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{selected.subject}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-full px-2 py-0.5 ${selected.priority === "urgent" ? "bg-destructive/15 text-destructive" : "bg-brand/15 text-brand"}`}>{selected.priority}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{selected.category}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">sentiment - {selected.sentiment}</span>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="mt-5 rounded-2xl border border-brand/30 bg-brand/5 p-4"
              >
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-brand">
                  <Sparkles className="h-3.5 w-3.5" /> AI Summary
                </div>
                <p className="text-sm">{selected.aiSummary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(selected.aiActions ?? []).map(a => (
                    <button key={a} onClick={() => setReplyText(`${replyText}\n\nNext action: ${a}`)} className="rounded-lg border border-brand/30 bg-background/50 px-2.5 py-1 text-xs hover:bg-brand/10 transition">
                      {a}
                    </button>
                  ))}
                </div>
              </motion.div>

              <div className="mt-6 flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-semibold text-white" style={{ background: avatarColor(selected.from.name) }}>
                  {ini(selected.from.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{selected.from.name}</span>
                    <span className="text-muted-foreground">&lt;{selected.from.email}&gt;</span>
                    <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1"><CheckCheck className="h-3 w-3 text-success" /> {selected.time}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">to me</div>
                </div>
              </div>

              <div className="mt-5 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
                {selected.body}
              </div>

              {selected.attachments && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {(selected.attachments ?? []).map(a => (
                    <div key={a.name} className="flex items-center gap-2 rounded-lg glass px-3 py-2 text-sm">
                      <Paperclip className="h-3.5 w-3.5 text-brand" /> {a.name}
                      <span className="text-xs text-muted-foreground">{a.size}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 rounded-2xl glass-strong p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium">
                  <Bot className="h-3.5 w-3.5 text-brand" /> Smart reply - drafted in your voice
                </div>
                <textarea
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  className="h-32 w-full resize-none rounded-lg border border-border/60 bg-background/40 p-3 text-sm focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-1.5">
                    {["Friendly", "Formal", "Concise", "Persuasive"].map(t => (
                      <button key={t} onClick={() => generateReply(t)} className={`rounded-md border px-2 py-1 text-[11px] transition ${replyTone === t ? "border-brand/60 text-brand" : "border-border/60 hover:border-brand/40"}`}>{t}</button>
                    ))}
                  </div>
                  <button disabled={busy} onClick={sendReply} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-brand px-3.5 py-2 text-sm font-medium text-brand-foreground shadow-glow disabled:opacity-60">
                    <Reply className="h-3.5 w-3.5" /> {busy ? "Working..." : "Send"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ToolBtn({ icon: Icon, label, onClick }: { icon: ComponentType<SVGProps<SVGSVGElement>>; label?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition hover:bg-surface-elevated hover:text-foreground">
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}
