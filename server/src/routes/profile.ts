import { Router } from "express";
import { User } from "../models/User.js";
import { profileSchema } from "../validation.js";
import { publicUser, requireAuth } from "../services/auth.js";
import { AppError } from "../errors.js";

export const profileRouter = Router();
profileRouter.use(requireAuth);
profileRouter.get("/", (_req, res) => res.json({ user: res.locals.user }));
profileRouter.patch("/", async (req, res) => {
  const input = profileSchema.parse(req.body);
  const user = await User.findByIdAndUpdate(
    req.session.userId,
    { $set: { name: input.name } },
    { new: true, runValidators: true },
  );
  if (!user) throw new AppError(401, "AUTH_REQUIRED", "Sign in to continue.");
  res.json({ user: publicUser(user) });
});
