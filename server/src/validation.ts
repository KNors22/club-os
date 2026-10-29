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
  .pipe(z.email("Enter a valid email address.").max(254));
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
