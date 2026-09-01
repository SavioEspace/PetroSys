import { Router } from "express";

import {
  requireAuth,
  requireRoles
} from "../auth/auth.middleware.js";

import {
  createUserController,
  getUserByIdController,
  listUsersController,
  updateUserController,
  updateUserStatusController
} from "./users.controller.js";

export const usersRouter = Router();

usersRouter.get(
  "/",
  requireAuth,
  requireRoles("GESTOR"),
  listUsersController
);

usersRouter.post(
  "/",
  requireAuth,
  requireRoles("GESTOR"),
  createUserController
);

usersRouter.get(
  "/:id",
  requireAuth,
  requireRoles("GESTOR"),
  getUserByIdController
);

usersRouter.patch(
  "/:id",
  requireAuth,
  requireRoles("GESTOR"),
  updateUserController
);

usersRouter.patch(
  "/:id/status",
  requireAuth,
  requireRoles("GESTOR"),
  updateUserStatusController
);