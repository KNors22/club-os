import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { loginSchema, registerSchema } from "../validation.js";
import {
  authenticateUser,
  establishSession,
  publicUser,
  registerUser,
  requireAuth,
} from "../services/auth.js";

export const sessionCookieName = "clubos.sid";

export function authRouter(isProduction: boolean) {
  const router = Router();
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      error: {
        code: "TOO_MANY_ATTEMPTS",
        message: "Too many attempts. Please try again in 15 minutes.",
      },
    },
  });
  router.post("/register", limiter, async (req, res) => {
    const user = await registerUser(registerSchema.parse(req.body));
    await establishSession(req, user.id);
    res.status(201).json({ user: publicUser(user) });
  });
  router.post("/login", limiter, async (req, res) => {
    const input = loginSchema.parse(req.body);
    const user = await authenticateUser(input.email, input.password);
    await establishSession(req, user.id);
    res.json({ user: publicUser(user) });
  });
  router.get("/me", requireAuth, (_req, res) =>
    res.json({ user: res.locals.user }),
  );
  router.post("/logout", async (req, res) => {
    await new Promise<void>((resolve, reject) =>
      req.session.destroy((error) => (error ? reject(error) : resolve())),
    );
    res.clearCookie(sessionCookieName, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
    });
    res.status(204).end();
  });
  return router;
}
