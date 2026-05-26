import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Workflow, Plus, Zap, Bot, Tag, Forward, Bell, Trash2 } from "lucide-react";
import { apiGet, apiPatch, apiPost, defaultAutomations, loadStoredAutomations, saveStoredAutomations, type Automation } from "@/lib/api";

export const Route = createFileRoute("/app/automations")({
  component: Automations,
});

const icons = { forward: Forward, bell: Bell, zap: Zap, tag: Tag, bot: Bot };

function Automations() {
  const [items, setItems] = useState<Automation[]>(() => loadStoredAutomations());
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("");
  const [action, setAction] = useState("");

  useEffect(() => {
    apiGet<Automation[]>("/api/automations", defaultAutomations).then((next) => {
      setItems(next);
      saveStoredAutomations(next);
    });
  }, []);

  useEffect(() => {
    saveStoredAutomations(items);
  }, [items]);

  async function toggle(item: Automation) {
    const patch = { on: !item.on };
    setItems((current) => current.map((existing) => existing.id === item.id ? { ...existing, ...patch } : existing));
    await apiPatch(`/api/automations/${item.id}`, patch, null);
  }

  async function remove(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
    await fetch(`/api/automations/${id}`, { method: "DELETE" }).catch(() => undefined);
  }

  async function addAutomation() {
    const fallback: Automation = {
      id: `local-${Date.now()}`,
      name: name || "New automation",
      trigger: trigger || "New inbound email",
      action: action || "Draft suggested reply",
      runs: 0,
      on: true,
      icon: "bot",
    };
    const created = await apiPost<Automation>("/api/automations", fallback, fallback);
    setItems((current) => [created, ...current]);
    setName("");
    setTrigger("");
    setAction("");
  }

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.2em] text-brand">Automations</div>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight md:text-4xl">Workflows on autopilot</h1>
          <p className="mt-1 text-muted-foreground">Trigger-based rules running across every connected mailbox.</p>
        </div>
        <button onClick={addAutomation} className="inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-4 py-2 text-sm font-medium text-brand-foreground shadow-glow">
          <Plus className="h-4 w-4" /> New automation
        </button>
      </div>

      <div className="mb-4 grid gap-3 rounded-2xl glass p-5 md:grid-cols-3">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Automation name" className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none focus:border-brand/60" />
        <input value={trigger} onChange={(event) => setTrigger(event.target.value)} placeholder="Trigger" className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none focus:border-brand/60" />
        <input value={action} onChange={(event) => setAction(event.target.value)} placeholder="Action" className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none focus:border-brand/60" />
      </div>

      <div className="grid gap-3">
        {items.map(it => {
          const Icon = icons[it.icon] ?? Bot;
          return (
            <div key={it.id} className="group flex items-center gap-4 rounded-2xl glass p-5 transition hover:border-brand/40">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-brand shadow-glow">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-display text-base font-semibold">{it.name}</div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${it.on ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                    {it.on ? "Active" : "Paused"}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded bg-background/60 px-2 py-0.5">if - {it.trigger}</span>
                  <span>to</span>
                  <span className="rounded bg-background/60 px-2 py-0.5 text-brand">then - {it.action}</span>
                </div>
              </div>
              <div className="hidden text-right md:block">
                <div className="font-display text-2xl font-semibold">{it.runs}</div>
                <div className="text-[11px] text-muted-foreground">runs - 30d</div>
              </div>
              <button
                onClick={() => toggle(it)}
                className={`relative h-6 w-10 rounded-full transition ${it.on ? "bg-gradient-brand" : "bg-muted"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${it.on ? "left-[22px]" : "left-0.5"}`} />
              </button>
              <button onClick={() => remove(it.id)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-surface-elevated transition">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl glass-strong p-6">
        <div className="mb-1 flex items-center gap-2">
          <Workflow className="h-4 w-4 text-brand" />
          <div className="font-display text-lg font-semibold">Suggested by NeuroMail</div>
        </div>
        <p className="text-sm text-muted-foreground">Based on 90 days of inbox patterns.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            { t: "Auto-archive AWS billing alerts", d: "You always archive these within 5 minutes.", trigger: "Sender contains AWS Billing", action: "Archive and forward to finance" },
            { t: "Snooze team digest emails to Friday 3pm", d: "You read them in batches at week's end.", trigger: "Subject contains team digest", action: "Snooze until Friday 3pm" },
          ].map(s => (
            <div key={s.t} className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-background/40 p-4">
              <div>
                <div className="text-sm font-medium">{s.t}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{s.d}</div>
              </div>
              <button onClick={() => {
                setName(s.t);
                setTrigger(s.trigger);
                setAction(s.action);
              }} className="shrink-0 rounded-lg border border-brand/40 px-2.5 py-1 text-xs text-brand hover:bg-brand/10 transition">Use</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
