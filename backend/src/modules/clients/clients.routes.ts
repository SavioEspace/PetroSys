import { Router } from "express";

import {
  requireAuth,
  requireRoles
} from "../auth/auth.middleware.js";

import {
  createClientController,
  getClientByIdController,
  listClientsController,
  updateClientController,
  updateClientStatusController
} from "./clients.controller.js";

export const clientsRouter =
  Router();

clientsRouter.get(
  "/",
  requireAuth,
  requireRoles(
    "GESTOR",
    "ANALISTA",
    "TECNICO"
  ),
  listClientsController
);

clientsRouter.post(
  "/",
  requireAuth,
  requireRoles(
    "GESTOR",
    "ANALISTA"
  ),
  createClientController
);

clientsRouter.get(
  "/:id",
  requireAuth,
  requireRoles(
    "GESTOR",
    "ANALISTA",
    "TECNICO"
  ),
  getClientByIdController
);

clientsRouter.patch(
  "/:id",
  requireAuth,
  requireRoles(
    "GESTOR",
    "ANALISTA"
  ),
  updateClientController
);

clientsRouter.patch(
  "/:id/status",
  requireAuth,
  requireRoles(
    "GESTOR",
    "ANALISTA"
  ),
  updateClientStatusController
);