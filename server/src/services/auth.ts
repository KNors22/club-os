import { compare, hash } from "bcryptjs";
import type { Request, RequestHandler } from "express";
import type { Types } from "mongoose";
import { User } from "../models/User.js";
import { AppError } from "../errors.js";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

const unknownAccountHash = hash("clubos-placeholder-for-unknown-accounts", 12);

export function publicUser(user: {
  _id: Types.ObjectId;
  name: string;
  email: string;
}) {
  return { id: user._id.toString(), name: user.name, email: user.email };
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  if (await User.exists({ email: input.email })) {
    throw new AppError(
      409,
      "EMAIL_IN_USE",
      "An account with this email already exists. Sign in instead.",
    );
  }
  return User.create({
    name: input.name,
    email: input.email,
    passwordHash: await hash(input.password, 12),
  });
}

export async function authenticateUser(email: string, password: string) {
  const user = await User.findOne({ email }).select("+passwordHash");
  const matches = await compare(
    password,
    user?.passwordHash ?? (await unknownAccountHash),
  );
  if (!user || !matches)
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Email or password is incorrect.",
    );
  return user;
}

export async function establishSession(req: Request, userId: string) {
  await new Promise<void>((resolve, reject) =>
    req.session.regenerate((error) => (error ? reject(error) : resolve())),
  );
  req.session.userId = userId;
  await new Promise<void>((resolve, reject) =>
    req.session.save((error) => (error ? reject(error) : resolve())),
  );
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  if (!req.session.userId)
    throw new AppError(401, "AUTH_REQUIRED", "Sign in to continue.");
  const user = await User.findById(req.session.userId);
  if (!user)
    throw new AppError(
      401,
      "AUTH_REQUIRED",
      "Your account is unavailable. Sign in again.",
    );
  res.locals.user = publicUser(user);
  next();
};
