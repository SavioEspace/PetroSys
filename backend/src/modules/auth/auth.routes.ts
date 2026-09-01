import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  login,
  logout,
  me
} from "./auth.controller.js";

import {
  requireAuth
} from "./auth.middleware.js";

export const authRouter = Router();

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    error: "TOO_MANY_ATTEMPTS",
    message:
      "Muitas tentativas de login. Tente novamente mais tarde."
  }
});

authRouter.post(
  "/login",
  loginRateLimiter,
  login
);

authRouter.get(
  "/me",
  requireAuth,
  me
);

authRouter.post(
  "/logout",
  logout
);