import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Shield, Bell, CreditCard, Users, KeyRound, Check, RefreshCw } from "lucide-react";
import { getConnectedAccounts, getOAuthUrl, isProductionApiEnabled, syncAccount, type EmailAccount } from "@/lib/api";

export const Route = createFileRoute("/app/settings")({
  component: Settings,
});

const tabs = [
  { id: "profile", label: "Profile", icon: Users },
  { id: "integrations", label: "Integrations", icon: Mail },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "api", label: "API & webhooks", icon: KeyRound },
];

const appIntegrations = [
  { name: "Slack", desc: "Notify teams about hot leads", connected: false, color: "#4a154b" },
  { name: "Linear", desc: "Auto-create issues from emails", connected: false, color: "#5e6ad2" },
  { name: "Notion", desc: "Sync action items to Notion", connected: false, color: "#fff" },
  { name: "Salesforce", desc: "Log emails to opportunities", connected: false, color: "#00a1e0" },
];

function Settings() {
  const [tab, setTab] = useState("integrations");
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [status, setStatus] = useState(isProductionApiEnabled() ? "Ready to connect mailboxes" : "Set VITE_API_URL to enable live integrations");
  const [busy, setBusy] = useState(false);

  async function refreshAccounts() {
    setAccounts(await getConnectedAccounts());
  }

  useEffect(() => {
    refreshAccounts();
  }, []);

  async function connect(provider: "google" | "microsoft") {
    if (!isProductionApiEnabled()) {
      setStatus("Live API is not configured. Set VITE_API_URL first.");
      return;
    }
    setBusy(true);
    setStatus(`Opening ${provider === "google" ? "Gmail" : "Outlook"} OAuth...`);
    try {
      window.location.href = await getOAuthUrl(provider);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "OAuth connection failed");
      setBusy(false);
    }
  }

  async function sync(account: EmailAccount) {
    setBusy(true);
    setStatus(`Syncing ${account.email}...`);
    try {
      const result = await syncAccount(account.id);
      await refreshAccounts();
      setStatus(`Synced ${result.count} new messages from ${account.email}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-8">
      <div className="mb-6">
        <div className="text-xs font-medium uppercase tracking-[0.2em] text-brand">Settings</div>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight md:text-4xl">Workspace settings</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="space-y-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                tab === t.id ? "glass text-foreground" : "text-muted-foreground hover:bg-surface-elevated/40 hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </nav>

        <div>
          {tab === "integrations" && (
            <div className="space-y-3">
              <div className="rounded-2xl glass p-5">
                <div className="font-display text-lg font-semibold">Connected mailboxes & apps</div>
                <p className="text-sm text-muted-foreground">{status}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <MailboxCard
                  name="Gmail"
                  desc="Read, sync, and send with Gmail API"
                  color="#ea4335"
                  connected={accounts.some((account) => account.provider === "GMAIL")}
                  onConnect={() => connect("google")}
                  disabled={busy}
                />
                <MailboxCard
                  name="Outlook"
                  desc="Read, sync, and send with Microsoft Graph"
                  color="#0078d4"
                  connected={accounts.some((account) => account.provider === "OUTLOOK")}
                  onConnect={() => connect("microsoft")}
                  disabled={busy}
                />
              </div>

              {accounts.length > 0 && (
                <div className="rounded-2xl glass p-5">
                  <div className="mb-3 font-display text-base font-semibold">Mail accounts</div>
                  <div className="space-y-2">
                    {accounts.map((account) => (
                      <div key={account.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-3">
                        <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-brand text-xs font-bold text-white">
                          {account.provider[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{account.email}</div>
                          <div className="text-xs text-muted-foreground">{account.provider} {account.lastSyncedAt ? `- synced ${new Date(account.lastSyncedAt).toLocaleString()}` : "- not synced yet"}</div>
                        </div>
                        <button
                          onClick={() => sync(account)}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-brand/40 px-3 py-1.5 text-xs text-brand transition hover:bg-brand/10 disabled:opacity-60"
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Sync
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                {appIntegrations.map(i => (
                  <div key={i.name} className="flex items-center gap-4 rounded-2xl glass p-5">
                    <div className="grid h-11 w-11 place-items-center rounded-xl text-sm font-bold" style={{ background: i.color, color: i.name === "Notion" ? "#000" : "#fff" }}>
                      {i.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-display text-base font-semibold">{i.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{i.desc}</div>
                    </div>
                    <button className="rounded-lg bg-gradient-brand px-3 py-1.5 text-xs font-medium text-brand-foreground shadow-glow">Soon</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab !== "integrations" && (
            <div className="rounded-2xl glass p-8 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-gradient-brand shadow-glow">
                {(() => { const I = tabs.find(t => t.id === tab)!.icon; return <I className="h-6 w-6 text-white" />; })()}
              </div>
              <div className="mt-4 font-display text-xl font-semibold">{tabs.find(t => t.id === tab)!.label}</div>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Configure {tabs.find(t => t.id === tab)!.label.toLowerCase()} for your workspace.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MailboxCard({ name, desc, color, connected, onConnect, disabled }: {
  name: string;
  desc: string;
  color: string;
  connected: boolean;
  onConnect: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl glass p-5">
      <div className="grid h-11 w-11 place-items-center rounded-xl text-sm font-bold text-white" style={{ background: color }}>
        {name[0]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-base font-semibold">{name}</div>
        <div className="truncate text-xs text-muted-foreground">{desc}</div>
      </div>
      {connected ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-1 text-[11px] text-success">
          <Check className="h-3 w-3" /> Connected
        </span>
      ) : (
        <button onClick={onConnect} disabled={disabled} className="rounded-lg bg-gradient-brand px-3 py-1.5 text-xs font-medium text-brand-foreground shadow-glow disabled:opacity-60">Connect</button>
      )}
    </div>
  );
}
