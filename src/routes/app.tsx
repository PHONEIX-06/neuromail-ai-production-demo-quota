import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard, Inbox, PenSquare, BarChart3, Workflow, Settings,
  Search, Bell, Brain, Sparkles, Command, Plus,
} from "lucide-react";

export const Route = createFileRoute("/app")({
  component: AppShell,
});

const nav = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/app/inbox", label: "Inbox", icon: Inbox, badge: "12" },
  { to: "/app/compose", label: "AI Compose", icon: PenSquare, badge: "AI" },
  { to: "/app/automations", label: "Automations", icon: Workflow },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

function AppShell() {
  const loc = useLocation();
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <Link to="/" className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand shadow-glow">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-base font-semibold">NeuroMail</span>
          <span className="rounded-md bg-brand/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand">AI</span>
        </Link>

        <div className="px-3 py-4">
          <button className="flex w-full items-center gap-2 rounded-lg bg-gradient-brand px-3 py-2 text-sm font-medium text-brand-foreground shadow-glow transition hover:scale-[1.02]">
            <Plus className="h-4 w-4" /> New AI draft
          </button>
        </div>

        <nav className="flex-1 px-3">
          {nav.map(item => {
            const active = item.exact ? loc.pathname === item.to : loc.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`mb-0.5 flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                  active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <item.icon className="h-4 w-4" /> {item.label}
                </span>
                {item.badge && (
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${item.badge === "AI" ? "bg-brand/20 text-brand" : "bg-muted text-muted-foreground"}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="rounded-xl glass p-3.5">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5 text-brand" /> 1,284 AI actions left
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[68%] rounded-full bg-gradient-brand" />
            </div>
            <button className="mt-3 w-full rounded-md border border-border/60 px-2 py-1.5 text-xs hover:bg-surface-elevated transition">
              Upgrade plan
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-sidebar-border p-4">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-brand text-xs font-semibold text-white">AC</div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">Alex Carter</div>
            <div className="truncate text-xs text-muted-foreground">alex@neuromail.ai</div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur md:px-8">
          <div className="relative flex flex-1 items-center">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Semantic search across inbox, attachments, and meeting notes…"
              className="w-full rounded-lg border border-border/60 bg-surface/60 py-2 pl-10 pr-20 text-sm placeholder:text-muted-foreground focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            <kbd className="absolute right-3 inline-flex items-center gap-1 rounded border border-border/60 bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              <Command className="h-3 w-3" />K
            </kbd>
          </div>
          <button className="relative grid h-9 w-9 place-items-center rounded-lg glass hover:bg-surface-elevated transition">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand" />
          </button>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
