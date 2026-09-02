import { Router } from "express";

import {
  requireAuth,
  requireRoles
} from "../auth/auth.middleware.js";

import {
  createServiceController,
  getServiceByIdController,
  listServicesController,
  updateServiceController,
  updateServiceStatusController
} from "./services.controller.js";

export const servicesRouter =
  Router();

servicesRouter.get(
  "/",
  requireAuth,
  requireRoles(
    "GESTOR",
    "ANALISTA",
    "TECNICO"
  ),
  listServicesController
);

servicesRouter.post(
  "/",
  requireAuth,
  requireRoles(
    "GESTOR",
    "ANALISTA"
  ),
  createServiceController
);

servicesRouter.get(
  "/:id",
  requireAuth,
  requireRoles(
    "GESTOR",
    "ANALISTA",
    "TECNICO"
  ),
  getServiceByIdController
);

servicesRouter.patch(
  "/:id",
  requireAuth,
  requireRoles(
    "GESTOR",
    "ANALISTA"
  ),
  updateServiceController
);

servicesRouter.patch(
  "/:id/status",
  requireAuth,
  requireRoles(
    "GESTOR",
    "ANALISTA"
  ),
  updateServiceStatusController
);