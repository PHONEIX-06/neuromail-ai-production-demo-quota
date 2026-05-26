import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid,
} from "recharts";
import { productivityData, responseTimeData } from "@/lib/mock-data";
import { TrendingUp, Clock, Zap, Smile } from "lucide-react";

export const Route = createFileRoute("/app/analytics")({
  component: Analytics,
});

const teamData = [
  { name: "Alex Carter", sent: 312, ai: 98, avg: "9m", saved: "11.4h" },
  { name: "Priya Raman", sent: 287, ai: 142, avg: "12m", saved: "16.2h" },
  { name: "Jordan Kim", sent: 198, ai: 67, avg: "18m", saved: "7.8h" },
  { name: "Sofia Reyes", sent: 421, ai: 203, avg: "6m", saved: "22.1h" },
];

function Analytics() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <div>
        <div className="text-xs font-medium uppercase tracking-[0.2em] text-brand">Analytics</div>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight md:text-4xl">Productivity intelligence</h1>
        <p className="mt-1 text-muted-foreground">How your team's email habits are trending — and where AI is lifting the load.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Hours saved (mo)", v: "184.2h", d: "+38%", icon: Zap },
          { label: "Avg response time", v: "11m", d: "−42%", icon: Clock },
          { label: "Sentiment score", v: "84", d: "+6", icon: Smile },
          { label: "AI adoption", v: "92%", d: "+11%", icon: TrendingUp },
        ].map(s => (
          <div key={s.label} className="rounded-2xl glass p-5">
            <s.icon className="h-4 w-4 text-muted-foreground" />
            <div className="mt-3 font-display text-3xl font-semibold">{s.v}</div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{s.label}</span>
              <span className="text-success">{s.d}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl glass p-6">
          <div className="mb-2 font-display text-lg font-semibold">Volume by day</div>
          <div className="text-xs text-muted-foreground">Sent vs received vs AI-handled</div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="oklch(0.3 0.03 270 / 30%)" vertical={false} />
                <XAxis dataKey="day" stroke="oklch(0.6 0.02 270)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.6 0.02 270)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "oklch(0.22 0.03 270)", border: "1px solid oklch(0.3 0.03 270)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="received" fill="oklch(0.5 0.02 270)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sent" fill="oklch(0.78 0.18 200)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ai" fill="oklch(0.68 0.22 295)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl glass p-6">
          <div className="mb-2 font-display text-lg font-semibold">Response time by hour</div>
          <div className="text-xs text-muted-foreground">When your replies are fastest</div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={responseTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="oklch(0.3 0.03 270 / 30%)" vertical={false} />
                <XAxis dataKey="hour" stroke="oklch(0.6 0.02 270)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.6 0.02 270)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "oklch(0.22 0.03 270)", border: "1px solid oklch(0.3 0.03 270)", borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="avg" stroke="oklch(0.68 0.22 295)" strokeWidth={3} dot={{ fill: "oklch(0.68 0.22 295)", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl glass p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="font-display text-lg font-semibold">Team leaderboard</div>
          <span className="text-xs text-muted-foreground">This month</span>
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr className="border-b border-border/60">
              <th className="pb-3 text-left font-medium">Member</th>
              <th className="pb-3 text-right font-medium">Sent</th>
              <th className="pb-3 text-right font-medium">AI assists</th>
              <th className="pb-3 text-right font-medium">Avg response</th>
              <th className="pb-3 text-right font-medium">Saved</th>
            </tr>
          </thead>
          <tbody>
            {teamData.map(m => (
              <tr key={m.name} className="border-b border-border/40 last:border-0">
                <td className="py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-brand text-xs font-semibold text-white">
                      {m.name.split(" ").map(s => s[0]).join("")}
                    </div>
                    {m.name}
                  </div>
                </td>
                <td className="py-3.5 text-right">{m.sent}</td>
                <td className="py-3.5 text-right text-brand">{m.ai}</td>
                <td className="py-3.5 text-right">{m.avg}</td>
                <td className="py-3.5 text-right font-medium text-success">{m.saved}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
