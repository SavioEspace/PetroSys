import { Router } from "express";

import {
  requireAuth,
  requireRoles
} from "../auth/auth.middleware.js";

import {
  listUsersController
} from "./users.controller.js";

export const usersRouter = Router();

usersRouter.get(
  "/",
  requireAuth,
  requireRoles("GESTOR"),
  listUsersController
);