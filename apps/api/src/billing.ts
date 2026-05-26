import Stripe from "stripe";
import type { PrismaClient } from "@prisma/client";

export function stripeClient(secretKey?: string) {
  if (!secretKey) throw new Error("Stripe is not configured");
  return new Stripe(secretKey);
}

export async function createCheckoutSession(options: {
  prisma: PrismaClient;
  stripeSecretKey?: string;
  priceId: string;
  organizationId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = stripeClient(options.stripeSecretKey);
  const org = await options.prisma.organization.findUniqueOrThrow({ where: { id: options.organizationId } });
  const existing = await options.prisma.subscription.findUnique({ where: { organizationId: org.id } });
  const customerId = existing?.stripeCustomerId ?? (await stripe.customers.create({ name: org.name, metadata: { organizationId: org.id } })).id;
  if (!existing) {
    await options.prisma.subscription.create({
      data: { organizationId: org.id, stripeCustomerId: customerId, plan: "pro" },
    });
  }
  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: options.priceId, quantity: 1 }],
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    metadata: { organizationId: org.id },
  });
}

export async function handleStripeWebhook(options: {
  prisma: PrismaClient;
  stripeSecretKey?: string;
  webhookSecret?: string;
  signature?: string;
  rawBody: Buffer;
}) {
  const stripe = stripeClient(options.stripeSecretKey);
  if (!options.webhookSecret || !options.signature) throw new Error("Stripe webhook is not configured");
  const event = stripe.webhooks.constructEvent(options.rawBody, options.signature, options.webhookSecret);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const organizationId = session.metadata?.organizationId;
    if (organizationId) {
      await options.prisma.subscription.upsert({
        where: { organizationId },
        update: {
          stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
          stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : undefined,
          status: "ACTIVE",
          plan: "pro",
        },
        create: {
          organizationId,
          stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
          stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : undefined,
          status: "ACTIVE",
          plan: "pro",
        },
      });
    }
  }

  return event;
}
