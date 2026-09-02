import type {
  Response
} from "express";

import type {
  AuthenticatedRequest
} from "../auth/auth.middleware.js";

import {
  createWorkOrderSchema,
  updateWorkOrderSchema,
  updateWorkOrderStatusSchema,
  workOrderIdParamSchema
} from "./work-orders.schema.js";

import {
  createWorkOrder,
  getWorkOrderById,
  getWorkOrderHistory,
  listWorkOrders,
  updateWorkOrder,
  listActiveTechnicians,
  updateWorkOrderStatus
} from "./work-orders.service.js";

function ensureAuthenticated(
  request: AuthenticatedRequest,
  response: Response
): boolean {
  if (!request.auth) {
    response.status(401).json({
      error: "UNAUTHORIZED",
      message:
        "Autenticação necessária."
    });

    return false;
  }

  return true;
}

export async function listWorkOrdersController(
  request: AuthenticatedRequest,
  response: Response
): Promise<void> {
  if (
    !ensureAuthenticated(
      request,
      response
    )
  ) {
    return;
  }

  const ordens =
    await listWorkOrders(
      request.auth!.userId,
      request.auth!.perfil
    );

  response.status(200).json({
    ordens
  });
}

export async function getWorkOrderByIdController(
  request: AuthenticatedRequest,
  response: Response
): Promise<void> {
  if (
    !ensureAuthenticated(
      request,
      response
    )
  ) {
    return;
  }

  const parsedParams =
    workOrderIdParamSchema.safeParse(
      request.params
    );

  if (!parsedParams.success) {
    response.status(400).json({
      error:
        "INVALID_WORK_ORDER_ID",
      message:
        "ID da ordem de serviço inválido."
    });

    return;
  }

  const result =
    await getWorkOrderById(
      parsedParams.data.id,
      request.auth!.userId,
      request.auth!.perfil
    );

  if (!result.success) {
    if (
      result.reason ===
      "WORK_ORDER_NOT_FOUND"
    ) {
      response.status(404).json({
        error:
          "WORK_ORDER_NOT_FOUND",
        message:
          "Ordem de serviço não encontrada."
      });

      return;
    }

    response.status(403).json({
      error: "FORBIDDEN",
      message:
        "Você não possui acesso a esta ordem de serviço."
    });

    return;
  }

  response.status(200).json({
    ordem:
      result.ordem
  });
}

export async function createWorkOrderController(
  request: AuthenticatedRequest,
  response: Response
): Promise<void> {
  if (
    !ensureAuthenticated(
      request,
      response
    )
  ) {
    return;
  }

  const parsedBody =
    createWorkOrderSchema.safeParse(
      request.body
    );

  if (!parsedBody.success) {
    response.status(400).json({
      error:
        "VALIDATION_ERROR",
      message:
        "Dados da ordem de serviço inválidos.",
      details:
        parsedBody.error.flatten()
          .fieldErrors
    });

    return;
  }

  const result =
    await createWorkOrder(
      parsedBody.data,
      request.auth!.userId
    );

  if (!result.success) {
    switch (result.reason) {
      case "CONTRACT_NOT_FOUND":
        response.status(404).json({
          error:
            "CONTRACT_NOT_FOUND",
          message:
            "Contrato não encontrado."
        });
        return;

      case "CLIENT_INACTIVE":
        response.status(409).json({
          error:
            "CLIENT_INACTIVE",
          message:
            "Não é possível abrir uma ordem para cliente inativo."
        });
        return;

      case "CONTRACT_NOT_ACTIVE":
        response.status(409).json({
          error:
            "CONTRACT_NOT_ACTIVE",
          message:
            "O contrato informado não está ativo."
        });
        return;

      case "CONTRACT_EXPIRED":
        response.status(409).json({
          error:
            "CONTRACT_EXPIRED",
          message:
            "O contrato informado está vencido."
        });
        return;

      case "SERVICE_NOT_FOUND":
        response.status(404).json({
          error:
            "SERVICE_NOT_FOUND",
          message:
            "Serviço tecnológico não encontrado."
        });
        return;

      case "SERVICE_CONTRACT_MISMATCH":
        response.status(409).json({
          error:
            "SERVICE_CONTRACT_MISMATCH",
          message:
            "O serviço informado não pertence ao contrato selecionado."
        });
        return;

      case "SERVICE_NOT_ACTIVE":
        response.status(409).json({
          error:
            "SERVICE_NOT_ACTIVE",
          message:
            "O serviço tecnológico informado não está ativo."
        });
        return;

      case "RESPONSIBLE_NOT_FOUND":
        response.status(404).json({
          error:
            "RESPONSIBLE_NOT_FOUND",
          message:
            "Responsável técnico não encontrado."
        });
        return;

      case "RESPONSIBLE_INACTIVE":
        response.status(409).json({
          error:
            "RESPONSIBLE_INACTIVE",
          message:
            "O responsável técnico informado está inativo."
        });
        return;

      case "RESPONSIBLE_NOT_TECHNICIAN":
        response.status(409).json({
          error:
            "RESPONSIBLE_NOT_TECHNICIAN",
          message:
            "O responsável pela ordem deve possuir perfil TECNICO."
        });
        return;

      case "DEADLINE_IN_PAST":
        response.status(400).json({
          error:
            "DEADLINE_IN_PAST",
          message:
            "O prazo da ordem de serviço não pode estar no passado."
        });
        return;
    }
  }

  response.status(201).json({
    message:
      "Ordem de serviço criada com sucesso.",
    ordem:
      result.ordem
  });
}

export async function updateWorkOrderController(
  request: AuthenticatedRequest,
  response: Response
): Promise<void> {
  const parsedParams =
    workOrderIdParamSchema.safeParse(
      request.params
    );

  if (!parsedParams.success) {
    response.status(400).json({
      error:
        "INVALID_WORK_ORDER_ID",
      message:
        "ID da ordem de serviço inválido."
    });

    return;
  }

  const parsedBody =
    updateWorkOrderSchema.safeParse(
      request.body
    );

  if (!parsedBody.success) {
    response.status(400).json({
      error:
        "VALIDATION_ERROR",
      message:
        "Dados de atualização inválidos.",
      details:
        parsedBody.error.flatten()
          .fieldErrors
    });

    return;
  }

  const result =
    await updateWorkOrder(
      parsedParams.data.id,
      parsedBody.data
    );

  if (!result.success) {
    switch (result.reason) {
      case "WORK_ORDER_NOT_FOUND":
        response.status(404).json({
          error:
            "WORK_ORDER_NOT_FOUND",
          message:
            "Ordem de serviço não encontrada."
        });
        return;

      case "RESPONSIBLE_NOT_FOUND":
        response.status(404).json({
          error:
            "RESPONSIBLE_NOT_FOUND",
          message:
            "Responsável técnico não encontrado."
        });
        return;

      case "RESPONSIBLE_INACTIVE":
        response.status(409).json({
          error:
            "RESPONSIBLE_INACTIVE",
          message:
            "O responsável técnico informado está inativo."
        });
        return;

      case "RESPONSIBLE_NOT_TECHNICIAN":
        response.status(409).json({
          error:
            "RESPONSIBLE_NOT_TECHNICIAN",
          message:
            "O responsável deve possuir perfil TECNICO."
        });
        return;

      case "DEADLINE_IN_PAST":
        response.status(400).json({
          error:
            "DEADLINE_IN_PAST",
          message:
            "O novo prazo não pode estar no passado."
        });
        return;
    }
  }

  response.status(200).json({
    message:
      "Ordem de serviço atualizada com sucesso.",
    ordem:
      result.ordem
  });
}

export async function updateWorkOrderStatusController(
  request: AuthenticatedRequest,
  response: Response
): Promise<void> {
  if (
    !ensureAuthenticated(
      request,
      response
    )
  ) {
    return;
  }

  const parsedParams =
    workOrderIdParamSchema.safeParse(
      request.params
    );

  if (!parsedParams.success) {
    response.status(400).json({
      error:
        "INVALID_WORK_ORDER_ID",
      message:
        "ID da ordem de serviço inválido."
    });

    return;
  }

  const parsedBody =
    updateWorkOrderStatusSchema.safeParse(
      request.body
    );

  if (!parsedBody.success) {
    response.status(400).json({
      error:
        "VALIDATION_ERROR",
      message:
        "Status da ordem de serviço inválido.",
      details:
        parsedBody.error.flatten()
          .fieldErrors
    });

    return;
  }

  const result =
    await updateWorkOrderStatus(
      parsedParams.data.id,
      parsedBody.data.status,
      parsedBody.data.observacao,
      request.auth!.userId,
      request.auth!.perfil
    );

  if (!result.success) {
    if (
      result.reason ===
      "WORK_ORDER_NOT_FOUND"
    ) {
      response.status(404).json({
        error:
          "WORK_ORDER_NOT_FOUND",
        message:
          "Ordem de serviço não encontrada."
      });

      return;
    }

    if (
      result.reason ===
      "FORBIDDEN"
    ) {
      response.status(403).json({
        error:
          "FORBIDDEN",
        message:
          "Você não possui permissão para alterar esta ordem de serviço."
      });

      return;
    }

    response.status(409).json({
      error:
        "INVALID_STATUS_TRANSITION",
      message:
        "A transição de status solicitada não é permitida."
    });

    return;
  }

  response.status(200).json({
    message:
      "Status da ordem de serviço atualizado com sucesso.",
    ordem:
      result.ordem
  });
}

export async function getWorkOrderHistoryController(
  request: AuthenticatedRequest,
  response: Response
): Promise<void> {
  if (
    !ensureAuthenticated(
      request,
      response
    )
  ) {
    return;
  }

  const parsedParams =
    workOrderIdParamSchema.safeParse(
      request.params
    );

  if (!parsedParams.success) {
    response.status(400).json({
      error:
        "INVALID_WORK_ORDER_ID",
      message:
        "ID da ordem de serviço inválido."
    });

    return;
  }

  const result =
    await getWorkOrderHistory(
      parsedParams.data.id,
      request.auth!.userId,
      request.auth!.perfil
    );

  if (!result.success) {
    if (
      result.reason ===
      "WORK_ORDER_NOT_FOUND"
    ) {
      response.status(404).json({
        error:
          "WORK_ORDER_NOT_FOUND",
        message:
          "Ordem de serviço não encontrada."
      });

      return;
    }

    response.status(403).json({
      error:
        "FORBIDDEN",
      message:
        "Você não possui acesso ao histórico desta ordem de serviço."
    });

    return;
  }

  response.status(200).json({
    historicos:
      result.historicos
  });
}

export async function listActiveTechniciansController(
  _request: AuthenticatedRequest,
  response: Response
): Promise<void> {
  const tecnicos =
    await listActiveTechnicians();

  response.status(200).json({
    tecnicos
  });
}