import { Router } from "express";

import {
  requireAuth,
  requireRoles
} from "../auth/auth.middleware.js";

import {
  createWorkOrderController,
  getWorkOrderByIdController,
  getWorkOrderHistoryController,
  listWorkOrdersController,
  updateWorkOrderController,
  listActiveTechniciansController,
  updateWorkOrderStatusController
} from "./work-orders.controller.js";

export const workOrdersRouter =
  Router();

workOrdersRouter.get(
  "/",
  requireAuth,
  requireRoles(
    "GESTOR",
    "ANALISTA",
    "TECNICO"
  ),
  listWorkOrdersController
);

workOrdersRouter.post(
  "/",
  requireAuth,
  requireRoles(
    "GESTOR",
    "ANALISTA"
  ),
  createWorkOrderController
);
workOrdersRouter.get(
  "/technicians",
  requireAuth,
  requireRoles(
    "GESTOR",
    "ANALISTA"
  ),
  listActiveTechniciansController
);

workOrdersRouter.get(
  "/:id/history",
  requireAuth,
  requireRoles(
    "GESTOR",
    "ANALISTA",
    "TECNICO"
  ),
  getWorkOrderHistoryController
);

workOrdersRouter.get(
  "/:id",
  requireAuth,
  requireRoles(
    "GESTOR",
    "ANALISTA",
    "TECNICO"
  ),
  getWorkOrderByIdController
);

workOrdersRouter.patch(
  "/:id",
  requireAuth,
  requireRoles(
    "GESTOR",
    "ANALISTA"
  ),
  updateWorkOrderController
);

workOrdersRouter.patch(
  "/:id/status",
  requireAuth,
  requireRoles(
    "GESTOR",
    "ANALISTA",
    "TECNICO"
  ),
  updateWorkOrderStatusController
);