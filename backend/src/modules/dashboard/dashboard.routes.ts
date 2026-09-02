import { Router } from "express";

import {
  requireAuth,
  requireRoles
} from "../auth/auth.middleware.js";

import {
  getDashboardSummaryController
} from "./dashboard.controller.js";

export const dashboardRouter =
  Router();

dashboardRouter.get(
  "/summary",
  requireAuth,
  requireRoles(
    "GESTOR",
    "ANALISTA"
  ),
  getDashboardSummaryController
);