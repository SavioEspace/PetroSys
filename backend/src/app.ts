import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env.js";

import { authRouter } from "./modules/auth/auth.routes.js";
import { clientsRouter } from "./modules/clients/clients.routes.js";
import { contractsRouter } from "./modules/contracts/contracts.routes.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { servicesRouter } from "./modules/services/services.routes.js";
import { workOrdersRouter } from "./modules/work-orders/work-orders.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import {
  errorHandler,
  notFoundHandler
} from "./middlewares/error.middleware.js";

export const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true
  })
);

app.use(
  express.json({
    limit: "1mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb"
  })
);

app.use(cookieParser());

app.use(
  "/api/v1",
  (_request, response, next) => {
    response.setHeader(
      "Cache-Control",
      "no-store"
    );

    next();
  }
);

app.get(
  "/",
  (_request, response) => {
    response.status(200).json({
      name: "PetroSys API",
      version: "1.0.0"
    });
  }
);

app.use(
  "/api/v1/health",
  healthRouter
);

app.use(
  "/api/v1/auth",
  authRouter
);

app.use(
  "/api/v1/users",
  usersRouter
);

app.use(
  "/api/v1/clients",
  clientsRouter
);

app.use(
  "/api/v1/contracts",
  contractsRouter
);

app.use(
  "/api/v1/services",
  servicesRouter
);

app.use(
  "/api/v1/work-orders",
  workOrdersRouter
);

app.use(
  "/api/v1/dashboard",
  dashboardRouter
);

app.use(notFoundHandler);

app.use(errorHandler);