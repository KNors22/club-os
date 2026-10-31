import { z } from "zod";

const name = z
  .string()
  .trim()
  .min(2, "Use at least 2 characters for your name.")
  .max(100);
const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .refine(
    (value) =>
      /^[a-z]+@clubos$/.test(value) || z.email().safeParse(value).success,
    "Enter a valid email address.",
  );
const password = z
  .string()
  .min(10, "Use at least 10 characters for your password.")
  .max(72, "Use no more than 72 characters for your password.")
  .refine(
    (value) => Buffer.byteLength(value, "utf8") <= 72,
    "Password must fit within 72 UTF-8 bytes.",
  );

export const registerSchema = z.object({ name, email, password }).strict();
export const loginSchema = z
  .object({ email, password: z.string().min(1).max(256) })
  .strict();
export const profileSchema = z.object({ name }).strict();
export const organizationSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Use at least 2 characters for the club name.")
      .max(100),
    description: z.string().trim().max(500).default(""),
    feeCents: z
      .number()
      .int()
      .min(1, "The membership fee must be positive.")
      .max(1000000),
    termDays: z.number().int().min(1).max(1095),
  })
  .strict();
export const joinSchema = z
  .object({
    joinCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-F0-9]{12}$/, "Enter a valid 12-character join code."),
  })
  .strict();
export const idSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid record ID.");
export const membershipQuerySchema = z.object({
  search: z.string().trim().max(100).default(""),
  status: z.enum(["all", "pending", "active", "expired"]).default("all"),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const paymentInputSchema = z
  .object({
    requestId: z.uuid(),
    amountCents: z.number().int().min(1).max(1000000),
    method: z.enum(["cash", "e-transfer", "other"]),
    reference: z.string().trim().max(120).default(""),
    paidAt: z.iso
      .datetime({ offset: true })
      .refine(
        (value) => new Date(value).getTime() <= Date.now(),
        "Payment date cannot be in the future.",
      ),
  })
  .strict();
export type PaymentInput = z.infer<typeof paymentInputSchema>;

export const eventInputSchema = z
  .object({
    title: z.string().trim().min(2).max(120),
    description: z.string().trim().max(1000).default(""),
    startsAt: z.iso
      .datetime({ offset: true })
      .refine(
        (value) => new Date(value).getTime() > Date.now(),
        "Choose a future event date.",
      ),
    location: z.string().trim().min(2).max(200),
    capacity: z.number().int().min(1).max(10000),
  })
  .strict();
export const eventQuerySchema = z.object({
  view: z.enum(["upcoming", "all"]).default("upcoming"),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});
export const emptyBodySchema = z.object({}).strict();

export const feeUpdateSchema = z
  .object({
    feeCents: organizationSchema.shape.feeCents,
    expectedFeeCents: organizationSchema.shape.feeCents,
  })
  .strict();
