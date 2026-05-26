import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "alex@neuromail.ai" },
    update: {},
    create: {
      email: "alex@neuromail.ai",
      name: "Alex Carter",
      timezone: "Asia/Kolkata",
    },
  });

  const organization = await prisma.organization.upsert({
    where: { slug: "neuromail-demo" },
    update: {},
    create: {
      name: "NeuroMail Demo",
      slug: "neuromail-demo",
      plan: "team",
    },
  });

  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: organization.id } },
    update: { role: "OWNER" },
    create: { userId: user.id, organizationId: organization.id, role: "OWNER" },
  });

  const workspace = await prisma.workspace.upsert({
    where: { organizationId_slug: { organizationId: organization.id, slug: "main" } },
    update: {},
    create: { organizationId: organization.id, name: "Main Workspace", slug: "main" },
  });

  const account = await prisma.emailAccount.upsert({
    where: { workspaceId_email: { workspaceId: workspace.id, email: "alex@neuromail.ai" } },
    update: {},
    create: {
      workspaceId: workspace.id,
      provider: "GMAIL",
      email: "alex@neuromail.ai",
      displayName: "Alex Carter",
    },
  });

  const thread = await prisma.emailThread.create({
    data: {
      workspaceId: workspace.id,
      subject: "Q3 partnership proposal - terms attached",
      emails: {
        create: {
          accountId: account.id,
          fromName: "Sarah Chen",
          fromEmail: "sarah@stripe.com",
          to: [{ name: "Alex Carter", email: "alex@neuromail.ai" }],
          subject: "Q3 partnership proposal - terms attached",
          preview: "Following up on our call with revised revenue share terms.",
          bodyText: "Hi team,\n\nFollowing up on our call. I've attached a revised proposal with updated revenue share terms and a 24-month exclusivity window.\n\nBest,\nSarah",
          labels: ["Sales"],
          priority: "URGENT",
          sentiment: "POSITIVE",
          aiSummary: "Sarah is proposing revised revenue terms and wants a follow-up call this week.",
          aiActions: ["Schedule meeting", "Draft acceptance reply", "Forward to legal"],
          isRead: false,
          isStarred: true,
        },
      },
    },
  });

  await prisma.workflowAutomation.create({
    data: {
      workspaceId: workspace.id,
      name: "Auto-route invoices",
      trigger: { field: "subject", operator: "contains", value: "invoice" },
      actions: [{ type: "forward", to: "finance@neuromail.ai" }, { type: "label", label: "AP" }],
      enabled: true,
      runCount: 142,
    },
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      title: "Demo workspace ready",
      body: `Seeded workspace ${workspace.name} with thread ${thread.subject}.`,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
