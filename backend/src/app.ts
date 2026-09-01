import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env";
import { healthRouter } from "./modules/health/health.routes";

export const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true
  })
);

app.use(express.json());

app.get("/", (_request, response) => {
  return response.status(200).json({
    name: "PetroSys API",
    version: "1.0.0"
  });
});

app.use("/api/v1/health", healthRouter);