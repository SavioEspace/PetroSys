import { Router } from "express";

import { prisma } from "../../config/prisma.js";

export const healthRouter = Router();

healthRouter.get("/", async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return response.status(200).json({
      status: "ok",
      service: "PetroSys API",
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch {
    return response.status(503).json({
      status: "error",
      service: "PetroSys API",
      database: "disconnected",
      timestamp: new Date().toISOString()
    });
  }
});