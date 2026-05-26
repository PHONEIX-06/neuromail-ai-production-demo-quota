export type Email = {
  id: string;
  from: { name: string; email: string; avatar?: string };
  subject: string;
  preview: string;
  body: string;
  time: string;
  unread: boolean;
  starred: boolean;
  category: "Primary" | "Sales" | "Updates" | "Internal" | "Newsletter";
  priority: "urgent" | "high" | "normal" | "low";
  sentiment: "positive" | "neutral" | "negative";
  aiSummary: string;
  aiActions: string[];
  threadCount?: number;
  attachments?: { name: string; size: string }[];
};

const initials = (n: string) => n.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();
export const avatarColor = (n: string) => {
  const palette = ["#a78bfa", "#22d3ee", "#34d399", "#f59e0b", "#f472b6", "#60a5fa"];
  let h = 0; for (const c of n) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return palette[h % palette.length];
};
export const ini = initials;

export const emails: Email[] = [
  {
    id: "e1",
    from: { name: "Sarah Chen", email: "sarah@stripe.com" },
    subject: "Q3 partnership proposal — terms attached",
    preview: "Hi team, following up on our call last Thursday. I've attached a revised proposal with the…",
    body: "Hi team,\n\nFollowing up on our call last Thursday. I've attached a revised proposal with updated revenue share terms (35/65) and a 24-month exclusivity window. Can we get on a call this week to walk through it? Ideally Wed or Thu afternoon.\n\nBest,\nSarah",
    time: "9:42 AM",
    unread: true, starred: true,
    category: "Sales", priority: "urgent", sentiment: "positive",
    aiSummary: "Sarah from Stripe is proposing a 35/65 revenue split with 24-month exclusivity and wants a call Wed/Thu PM.",
    aiActions: ["Schedule meeting", "Draft acceptance reply", "Forward to legal"],
    threadCount: 4,
    attachments: [{ name: "Stripe_Proposal_v3.pdf", size: "1.2 MB" }],
  },
  {
    id: "e2",
    from: { name: "Linear", email: "notifications@linear.app" },
    subject: "12 issues assigned to you this week",
    preview: "Your weekly digest: 4 in progress, 6 in review, 2 blocked. Top priority: NEU-1284 ‘Vector index…",
    body: "Your weekly digest covering NeuroMail roadmap.",
    time: "8:15 AM",
    unread: true, starred: false,
    category: "Updates", priority: "normal", sentiment: "neutral",
    aiSummary: "Weekly Linear digest: 12 issues, 2 blocked. Top priority is NEU-1284 vector index migration.",
    aiActions: ["Open in Linear", "Snooze 1 day"],
  },
  {
    id: "e3",
    from: { name: "Marcus Webb", email: "marcus@acmecorp.io" },
    subject: "Re: Onboarding — final questions before signing",
    preview: "Two quick blockers before we sign the MSA: (1) data residency in EU, (2) SAML SSO timeline…",
    body: "Two quick blockers before we sign the MSA:\n1. Data residency — can we confirm EU-only storage?\n2. SAML SSO — what's the realistic timeline?\n\nWe'd like to close by Friday. — Marcus",
    time: "Yesterday",
    unread: true, starred: true,
    category: "Sales", priority: "urgent", sentiment: "neutral",
    aiSummary: "Marcus has 2 blockers before signing: EU data residency confirmation and SAML SSO timeline. Wants to close Friday.",
    aiActions: ["Reply with answers", "Loop in security", "Create deal note"],
    threadCount: 7,
  },
  {
    id: "e4",
    from: { name: "Notion", email: "team@notion.so" },
    subject: "Your team published 3 new docs",
    preview: "Engineering Wiki, Q4 OKRs, and Hiring loop v2 were updated this week…",
    body: "Doc updates from your workspace.",
    time: "Yesterday",
    unread: false, starred: false,
    category: "Updates", priority: "low", sentiment: "neutral",
    aiSummary: "3 new Notion docs from your workspace this week.",
    aiActions: ["Open Notion"],
  },
  {
    id: "e5",
    from: { name: "Priya Raman", email: "priya@neuromail.ai" },
    subject: "Design review — inbox v4 spec",
    preview: "Pushed the v4 inbox redesign to Figma. Key change: collapsing the priority lane into a single…",
    body: "Pushed v4 inbox redesign. Key change: collapsing the priority lane into a single command bar. Walkthrough at 3pm.",
    time: "Mon",
    unread: false, starred: true,
    category: "Internal", priority: "high", sentiment: "positive",
    aiSummary: "Priya shipped inbox v4 to Figma; design review at 3pm Monday.",
    aiActions: ["Add to calendar", "Open Figma"],
    threadCount: 3,
  },
  {
    id: "e6",
    from: { name: "AWS Billing", email: "no-reply@aws.amazon.com" },
    subject: "Your October invoice is ready — $4,287.55",
    preview: "Your AWS invoice for October 2026 is now available. Payment will be charged to the card on file…",
    body: "October AWS invoice: $4,287.55.",
    time: "Mon",
    unread: false, starred: false,
    category: "Updates", priority: "normal", sentiment: "neutral",
    aiSummary: "October AWS bill is $4,287.55, autopay scheduled.",
    aiActions: ["Forward to finance", "Archive"],
  },
  {
    id: "e7",
    from: { name: "Elena Vasquez", email: "elena@figma.com" },
    subject: "Speaking slot at Config 2026?",
    preview: "Hey! Loved your recent post on AI inbox UX. We'd love to have you on the AI track at Config…",
    body: "Speaking invite for Config 2026 AI track.",
    time: "Sat",
    unread: false, starred: true,
    category: "Primary", priority: "high", sentiment: "positive",
    aiSummary: "Speaking invite for Config 2026 AI track from Elena at Figma.",
    aiActions: ["Accept", "Ask for details"],
  },
  {
    id: "e8",
    from: { name: "Stripe Atlas", email: "atlas@stripe.com" },
    subject: "Annual filing deadline approaching",
    preview: "Your Delaware franchise tax filing is due Mar 1. We can handle it for you in one click…",
    body: "Delaware filing reminder.",
    time: "Fri",
    unread: false, starred: false,
    category: "Updates", priority: "normal", sentiment: "neutral",
    aiSummary: "Delaware franchise tax filing due March 1.",
    aiActions: ["File now", "Remind me Feb 15"],
  },
];

export const productivityData = [
  { day: "Mon", sent: 28, received: 142, ai: 18 },
  { day: "Tue", sent: 41, received: 168, ai: 26 },
  { day: "Wed", sent: 37, received: 155, ai: 31 },
  { day: "Thu", sent: 52, received: 189, ai: 38 },
  { day: "Fri", sent: 44, received: 172, ai: 34 },
  { day: "Sat", sent: 12, received: 64, ai: 8 },
  { day: "Sun", sent: 9, received: 51, ai: 6 },
];

export const categoryData = [
  { name: "Primary", value: 412, color: "var(--brand)" },
  { name: "Sales", value: 287, color: "var(--brand-glow)" },
  { name: "Internal", value: 198, color: "var(--success)" },
  { name: "Updates", value: 521, color: "var(--warning)" },
  { name: "Newsletter", value: 164, color: "var(--destructive)" },
];

export const responseTimeData = [
  { hour: "6a", avg: 42 }, { hour: "9a", avg: 18 }, { hour: "12p", avg: 12 },
  { hour: "3p", avg: 9 }, { hour: "6p", avg: 24 }, { hour: "9p", avg: 67 },
];
