import { Router } from "express";

import {
  requireAuth,
  requireRoles
} from "../auth/auth.middleware.js";

import {
  createContractController,
  getContractByIdController,
  listContractsController,
  updateContractController,
  updateContractStatusController
} from "./contracts.controller.js";

export const contractsRouter =
  Router();

contractsRouter.get(
  "/",
  requireAuth,
  requireRoles(
    "GESTOR",
    "ANALISTA",
    "TECNICO"
  ),
  listContractsController
);

contractsRouter.post(
  "/",
  requireAuth,
  requireRoles(
    "GESTOR",
    "ANALISTA"
  ),
  createContractController
);

contractsRouter.get(
  "/:id",
  requireAuth,
  requireRoles(
    "GESTOR",
    "ANALISTA",
    "TECNICO"
  ),
  getContractByIdController
);

contractsRouter.patch(
  "/:id",
  requireAuth,
  requireRoles(
    "GESTOR",
    "ANALISTA"
  ),
  updateContractController
);

contractsRouter.patch(
  "/:id/status",
  requireAuth,
  requireRoles(
    "GESTOR",
    "ANALISTA"
  ),
  updateContractStatusController
);