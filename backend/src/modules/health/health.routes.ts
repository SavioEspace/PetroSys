import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_request, response) => {
  return response.status(200).json({
    status: "ok",
    service: "PetroSys API",
    timestamp: new Date().toISOString()
  });
}); 