import { z } from "zod";

export const emailAddressSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
});

export const aiDraftSchema = z.object({
  to: z.string().email().optional(),
  subject: z.string().min(1).max(200),
  intent: z.string().min(3).max(4000),
  tone: z.enum(["formal", "professional", "friendly", "sales", "concise"]).default("professional"),
  length: z.enum(["short", "medium", "long"]).default("medium"),
});

export const aiReplySchema = z.object({
  emailId: z.string().min(1),
  tone: z.enum(["formal", "professional", "friendly", "sales", "concise"]).default("professional"),
});

export const createAutomationSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(2).max(120),
  trigger: z.record(z.unknown()),
  actions: z.array(z.record(z.unknown())).min(1),
});

export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(25),
  cursor: z.string().optional(),
});
