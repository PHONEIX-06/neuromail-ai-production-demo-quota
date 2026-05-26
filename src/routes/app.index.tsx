import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell,
} from "recharts";
import {
  TrendingUp, Mail, Clock, Zap, Inbox as InboxIcon, Sparkles, ArrowUpRight, Bot,
} from "lucide-react";
import { productivityData, categoryData, emails } from "@/lib/mock-data";

export const Route = createFileRoute("/app/")({
  component: Overview,
});

const stats = [
  { label: "Inbox zero progress", value: "82%", delta: "+14%", icon: InboxIcon, accent: "text-success" },
  { label: "AI drafts today", value: "47", delta: "+22", icon: Bot, accent: "text-brand" },
  { label: "Avg response time", value: "9m", delta: "−38%", icon: Clock, accent: "text-success" },
  { label: "Hours saved this week", value: "11.4", delta: "+2.1", icon: Zap, accent: "text-warning" },
];

function Overview() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-brand">Tuesday, May 13</div>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight md:text-4xl">Good morning, Alex.</h1>
            <p className="mt-1 text-muted-foreground">3 urgent threads need your attention. NeuroMail handled 18 routine emails for you overnight.</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-4 py-2 text-sm font-medium text-brand-foreground shadow-glow">
            <Sparkles className="h-4 w-4" /> Run morning brief
          </button>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.05 }}
            className="rounded-2xl glass p-5"
          >
            <div className="flex items-center justify-between">
              <s.icon className="h-4 w-4 text-muted-foreground" />
              <span className={`flex items-center gap-0.5 text-xs ${s.accent}`}>
                {s.delta} <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
            <div className="mt-3 font-display text-3xl font-semibold tracking-tight">{s.value}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl glass p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="font-display text-lg font-semibold">Email throughput</div>
              <div className="text-xs text-muted-foreground">Last 7 days · sent vs received vs AI-handled</div>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <Legend color="var(--brand)" label="AI handled" />
              <Legend color="var(--brand-glow)" label="Sent" />
              <Legend color="oklch(0.5 0.02 270)" label="Received" />
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.68 0.22 295)" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="oklch(0.68 0.22 295)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.78 0.18 200)" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="oklch(0.78 0.18 200)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="oklch(0.6 0.02 270)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.6 0.02 270)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "oklch(0.22 0.03 270)", border: "1px solid oklch(0.3 0.03 270)", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="received" stroke="oklch(0.55 0.02 270)" strokeWidth={1.5} fill="oklch(0.5 0.02 270 / 20%)" />
                <Area type="monotone" dataKey="sent" stroke="oklch(0.78 0.18 200)" strokeWidth={2} fill="url(#g2)" />
                <Area type="monotone" dataKey="ai" stroke="oklch(0.68 0.22 295)" strokeWidth={2.5} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl glass p-6">
          <div className="mb-3 font-display text-lg font-semibold">Smart categories</div>
          <div className="text-xs text-muted-foreground">Auto-classified this month</div>
          <div className="mt-2 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={2}>
                  {categoryData.map(c => <Cell key={c.name} fill={c.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {categoryData.map(c => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                  {c.name}
                </span>
                <span className="text-muted-foreground">{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl glass p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="font-display text-lg font-semibold">Priority queue</div>
            <span className="text-xs text-muted-foreground">Ranked by AI urgency model</span>
          </div>
          <div className="space-y-1">
            {emails.filter(e => e.priority === "urgent" || e.priority === "high").slice(0, 4).map(e => (
              <div key={e.id} className="group flex items-start gap-3 rounded-xl px-3 py-3 transition hover:bg-surface-elevated/60">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-brand text-xs font-semibold text-white">
                  {e.from.name.split(" ").map(s => s[0]).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium truncate">{e.from.name}</span>
                    <PriorityChip p={e.priority} />
                    <span className="ml-auto text-xs text-muted-foreground">{e.time}</span>
                  </div>
                  <div className="mt-0.5 truncate text-sm">{e.subject}</div>
                  <div className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-brand" />
                    <span className="line-clamp-1">{e.aiSummary}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl glass p-6">
          <div className="mb-1 flex items-center gap-2">
            <Bot className="h-4 w-4 text-brand" />
            <div className="font-display text-lg font-semibold">AI assistant</div>
          </div>
          <p className="text-xs text-muted-foreground">Ask anything about your inbox.</p>
          <div className="mt-4 space-y-2">
            {["Summarize Stripe thread", "Draft follow-up to Marcus", "What did Priya ship Monday?", "Find unpaid invoices"].map(q => (
              <button key={q} className="w-full rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-left text-sm transition hover:border-brand/40 hover:bg-surface-elevated/60">
                {q}
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-lg bg-gradient-brand p-[1px]">
            <input className="w-full rounded-[calc(theme(borderRadius.lg)-1px)] bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none" placeholder="Ask NeuroMail…" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: color }} />{label}</span>;
}
function PriorityChip({ p }: { p: string }) {
  const map: Record<string, string> = {
    urgent: "bg-destructive/15 text-destructive",
    high: "bg-warning/15 text-warning",
    normal: "bg-muted text-muted-foreground",
    low: "bg-muted text-muted-foreground",
  };
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${map[p]}`}>{p}</span>;
}
