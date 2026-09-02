import type {
  Request,
  Response
} from "express";

import {
  getDashboardSummary
} from "./dashboard.service.js";

export async function getDashboardSummaryController(
  _request: Request,
  response: Response
): Promise<void> {
  const resumo =
    await getDashboardSummary();

  response.status(200).json({
    resumo
  });
}