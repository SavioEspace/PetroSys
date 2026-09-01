import type {
  Request,
  Response
} from "express";

import { listUsers } from "./users.service.js";

export async function listUsersController(
  _request: Request,
  response: Response
): Promise<void> {
  const usuarios = await listUsers();

  response.status(200).json({
    usuarios
  });
}