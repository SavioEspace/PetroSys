import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";

export const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true
  })
);

/**
 * IMPORTANTE:
 * estes middlewares precisam vir ANTES das rotas.
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (_request, response) => {
  return response.status(200).json({
    name: "PetroSys API",
    version: "1.0.0"
  });
});

app.use("/api/v1/health", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", usersRouter);