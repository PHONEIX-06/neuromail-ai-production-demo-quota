import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Sparkles, Zap, Shield, BarChart3, Inbox, Brain, Workflow,
  ArrowRight, Check, Star, Mail, Bot, Lock, Globe2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "NeuroMail AI — The AI inbox for high-performance teams" },
      { name: "description", content: "NeuroMail AI summarizes, drafts, prioritizes, and automates email with a private LLM. Built for founders, ops, and revenue teams." },
      { property: "og:title", content: "NeuroMail AI" },
      { property: "og:description", content: "The AI inbox for high-performance teams." },
    ],
  }),
});

function Nav() {
  return (
    <header className="sticky top-0 z-50 glass border-b border-border/40">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="relative h-8 w-8 rounded-lg bg-gradient-brand shadow-glow">
            <div className="absolute inset-0 grid place-items-center">
              <Brain className="h-4.5 w-4.5 text-white" />
            </div>
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">NeuroMail</span>
          <span className="rounded-md bg-brand/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand">AI</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground transition">Features</a>
          <a href="#workflow" className="hover:text-foreground transition">Workflow</a>
          <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
          <a href="#security" className="hover:text-foreground transition">Security</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/app" className="hidden text-sm text-muted-foreground hover:text-foreground sm:block">Sign in</Link>
          <Link
            to="/app"
            className="group relative inline-flex items-center gap-1.5 rounded-lg bg-gradient-brand px-3.5 py-2 text-sm font-medium text-brand-foreground shadow-glow transition hover:scale-[1.02]"
          >
            Open app <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grid-bg" />
      <div className="absolute left-1/2 top-1/3 -z-10 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 bg-gradient-mesh opacity-40 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 lg:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-xs">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
            </span>
            <span className="text-muted-foreground">Now with on-device summarization</span>
            <span className="text-brand">→</span>
          </div>

          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            The AI inbox for{" "}
            <span className="text-gradient">high-performance</span> teams.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            NeuroMail summarizes, drafts, prioritizes, and automates email with a private LLM —
            so your team spends time on decisions, not triage.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/app"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-3 text-sm font-medium text-brand-foreground shadow-glow transition hover:scale-[1.02]"
            >
              Try the dashboard <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <a href="#features" className="inline-flex items-center gap-2 rounded-xl glass px-5 py-3 text-sm font-medium hover:bg-surface-elevated/60 transition">
              See it work
            </a>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> SOC 2 Type II</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> GDPR ready</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> Self-host option</span>
          </div>
        </motion.div>

        {/* Product mock */}
        <motion.div
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
          className="relative mx-auto mt-20 max-w-6xl"
        >
          <div className="absolute -inset-x-20 -top-20 -z-10 h-[400px] bg-gradient-mesh opacity-50 blur-3xl" />
          <div className="overflow-hidden rounded-2xl glass-strong shadow-elegant">
            <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-destructive/70" />
                <div className="h-3 w-3 rounded-full bg-warning/70" />
                <div className="h-3 w-3 rounded-full bg-success/70" />
              </div>
              <div className="ml-3 text-xs text-muted-foreground">app.neuromail.ai/inbox</div>
            </div>
            <div className="grid grid-cols-12 gap-0 bg-background/30">
              <aside className="col-span-3 hidden border-r border-border/40 p-4 md:block">
                {["Inbox", "Important", "Sales", "Internal", "Newsletters", "Sent", "Drafts"].map((l, i) => (
                  <div key={l} className={`mb-1 flex items-center justify-between rounded-md px-2.5 py-2 text-xs ${i === 0 ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>
                    <span>{l}</span>
                    {i === 0 && <span className="rounded bg-brand/20 px-1.5 py-0.5 text-[10px] text-brand">12</span>}
                  </div>
                ))}
              </aside>
              <div className="col-span-12 md:col-span-9 p-4">
                {[
                  { from: "Sarah Chen", subj: "Q3 partnership proposal", tag: "Urgent", color: "destructive" },
                  { from: "Marcus Webb", subj: "Re: Onboarding — final questions", tag: "Sales", color: "brand" },
                  { from: "Linear", subj: "12 issues assigned to you this week", tag: "Updates", color: "warning" },
                ].map((m, i) => (
                  <div key={i} className="group flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-surface-elevated/60 transition">
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-brand text-xs font-semibold text-white">
                      {m.from.split(" ").map(s => s[0]).join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{m.from}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] ${m.color === "destructive" ? "bg-destructive/15 text-destructive" : m.color === "brand" ? "bg-brand/15 text-brand" : "bg-warning/15 text-warning"}`}>{m.tag}</span>
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{m.subj}</div>
                    </div>
                    <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
                      <Sparkles className="h-3 w-3 text-brand" /> Summarized
                    </div>
                  </div>
                ))}
                <div className="mt-3 rounded-xl border border-brand/30 bg-brand/5 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs text-brand">
                    <Bot className="h-3.5 w-3.5" /> AI suggested reply · Marcus Webb
                  </div>
                  <p className="text-sm text-foreground/90">
                    "Hi Marcus — confirming EU-only storage via our Frankfurt region. SAML SSO is GA next Tuesday. Happy to close Friday — I'll send the redlined MSA in the morning."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-16 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Trusted by teams shipping at
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 opacity-60">
          {["Linear", "Stripe", "Figma", "Notion", "Vercel", "Cloudflare"].map(l => (
            <span key={l} className="font-display text-lg font-medium text-muted-foreground">{l}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

const features = [
  { icon: Brain, title: "Context-aware drafts", desc: "Replies that match your voice, your relationship history, and the thread context." },
  { icon: Zap, title: "Priority scoring", desc: "Urgency model trained on your responses. The 5 emails that matter, surfaced first." },
  { icon: Workflow, title: "Workflow automations", desc: "Trigger-based rules: auto-route invoices to finance, escalate churn signals, file receipts." },
  { icon: Inbox, title: "Semantic inbox search", desc: "Vector search across every thread, attachment, and meeting note. Find by intent, not keywords." },
  { icon: Shield, title: "Spam & phishing guard", desc: "On-device classifier blocks zero-day phishing 4× faster than legacy filters." },
  { icon: BarChart3, title: "Productivity analytics", desc: "Response time, sentiment trends, and AI-saved hours — for individuals and teams." },
];

function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-7xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <div className="text-xs font-medium uppercase tracking-[0.2em] text-brand">Capabilities</div>
        <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">An inbox that thinks ahead.</h2>
        <p className="mt-4 text-muted-foreground">14 AI capabilities across triage, drafting, search, and automation — all powered by your team's private model.</p>
      </div>
      <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="group relative overflow-hidden rounded-2xl glass p-6 transition hover:border-brand/40"
          >
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-12 -translate-y-12 rounded-full bg-gradient-brand opacity-0 blur-3xl transition group-hover:opacity-30" />
            <div className="relative">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-brand shadow-glow">
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Workflows() {
  const steps = [
    { n: "01", title: "Connect", desc: "Plug in Gmail, Outlook, IMAP, or Microsoft 365 in 30 seconds." },
    { n: "02", title: "Learn", desc: "NeuroMail studies your last 90 days to model voice, priorities, and contacts." },
    { n: "03", title: "Automate", desc: "Approve once. Recurring patterns become auto-routed, auto-replied, auto-archived." },
  ];
  return (
    <section id="workflow" className="relative border-y border-border/40 bg-surface/40 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-brand">Workflow</div>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">Set up once. Compounding leverage forever.</h2>
            <p className="mt-4 max-w-lg text-muted-foreground">No prompt engineering. No browser extensions. NeuroMail learns from how you respond and graduates from suggestion → autopilot at your pace.</p>
            <div className="mt-10 space-y-6">
              {steps.map(s => (
                <div key={s.n} className="flex gap-5">
                  <div className="font-display text-3xl font-semibold text-brand/60">{s.n}</div>
                  <div>
                    <div className="font-display text-lg font-semibold">{s.title}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="rounded-2xl glass-strong p-6 shadow-elegant">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium"><Workflow className="h-4 w-4 text-brand" /> Automation builder</div>
                <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] text-success">Live</span>
              </div>
              {[
                { trig: "When email contains 'invoice'", act: "Forward to finance@ + label 'AP'" },
                { trig: "When sender is in CRM 'Hot Leads'", act: "Suggest reply within 5 min" },
                { trig: "When sentiment = negative + Customer", act: "Page on-call + draft empathetic reply" },
              ].map((r, i) => (
                <div key={i} className="mb-3 last:mb-0 rounded-xl border border-border/60 bg-background/40 p-4 text-sm">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Trigger</div>
                  <div>{r.trig}</div>
                  <div className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">Action</div>
                  <div className="text-brand">{r.act}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const tiers = [
    { name: "Starter", price: "$0", desc: "For solo operators getting started.", features: ["1 mailbox", "200 AI actions / mo", "Smart summaries", "Basic analytics"], cta: "Start free" },
    { name: "Pro", price: "$29", desc: "For founders and power users.", features: ["3 mailboxes", "Unlimited AI actions", "Automation builder", "Vector search", "Priority support"], cta: "Start 14-day trial", featured: true },
    { name: "Team", price: "$79", desc: "Per seat, for revenue & ops teams.", features: ["Shared inbox", "RBAC + audit log", "Custom voice models", "SSO + SCIM", "Dedicated CSM"], cta: "Talk to sales" },
  ];
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <div className="text-xs font-medium uppercase tracking-[0.2em] text-brand">Pricing</div>
        <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">Pay for outcomes, not seats.</h2>
        <p className="mt-4 text-muted-foreground">Every plan includes private inference, encrypted at rest, never used for model training.</p>
      </div>
      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {tiers.map(t => (
          <div key={t.name} className={`relative rounded-2xl p-7 ${t.featured ? "glass-strong shadow-glow ring-1 ring-brand/40" : "glass"}`}>
            {t.featured && <div className="absolute -top-3 left-7 rounded-full bg-gradient-brand px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">Most popular</div>}
            <div className="font-display text-lg">{t.name}</div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-display text-5xl font-semibold">{t.price}</span>
              <span className="text-sm text-muted-foreground">/mo</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {t.features.map(f => (
                <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-brand" /> {f}</li>
              ))}
            </ul>
            <Link
              to="/app"
              className={`mt-7 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                t.featured ? "bg-gradient-brand text-brand-foreground shadow-glow hover:scale-[1.02]" : "glass hover:bg-surface-elevated/60"
              }`}
            >
              {t.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function Security() {
  const items = [
    { icon: Lock, title: "End-to-end encryption", desc: "Messages encrypted in transit and at rest with per-tenant keys." },
    { icon: Shield, title: "SOC 2 Type II", desc: "Annual audits, continuous controls monitoring." },
    { icon: Globe2, title: "Data residency", desc: "Pin storage to US, EU, or APAC. BYO cloud available." },
    { icon: Mail, title: "Zero training", desc: "Your email is never used to train shared models. Ever." },
  ];
  return (
    <section id="security" className="border-t border-border/40 bg-surface/40 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-brand">Security</div>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">Built for regulated industries.</h2>
            <p className="mt-4 max-w-lg text-muted-foreground">Engineered with the rigor of a payments platform. Used by finance, legal, and healthcare teams who can't compromise.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map(i => (
              <div key={i.title} className="rounded-xl glass p-5">
                <i.icon className="mb-3 h-5 w-5 text-brand" />
                <div className="font-display text-base font-semibold">{i.title}</div>
                <p className="mt-1 text-xs text-muted-foreground">{i.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-24">
      <div className="relative overflow-hidden rounded-3xl glass-strong p-12 text-center shadow-elegant md:p-20">
        <div className="absolute inset-0 -z-10 bg-gradient-mesh opacity-40" />
        <Star className="mx-auto h-7 w-7 text-brand" />
        <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-6xl">
          Take your inbox <span className="text-gradient">off your plate.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">14 days free. Setup in 60 seconds. Cancel anytime.</p>
        <div className="mt-8">
          <Link to="/app" className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-3.5 text-sm font-medium text-brand-foreground shadow-glow transition hover:scale-[1.02]">
            Open NeuroMail <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/40 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 text-sm text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-gradient-brand" />
          <span className="font-display font-semibold text-foreground">NeuroMail AI</span>
          <span className="ml-2">© 2026</span>
        </div>
        <div className="flex gap-6">
          <a className="hover:text-foreground" href="#">Privacy</a>
          <a className="hover:text-foreground" href="#">Terms</a>
          <a className="hover:text-foreground" href="#">Status</a>
          <a className="hover:text-foreground" href="#">Docs</a>
        </div>
      </div>
    </footer>
  );
}

function Landing() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main>
        <Hero />
        <Features />
        <Workflows />
        <Pricing />
        <Security />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
