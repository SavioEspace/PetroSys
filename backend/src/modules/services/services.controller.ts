import type {
  Request,
  Response
} from "express";

import {
  createServiceSchema,
  serviceIdParamSchema,
  updateServiceSchema,
  updateServiceStatusSchema
} from "./services.schema.js";

import {
  createService,
  getServiceById,
  listServices,
  updateService,
  updateServiceStatus
} from "./services.service.js";

export async function listServicesController(
  _request: Request,
  response: Response
): Promise<void> {
  const servicos =
    await listServices();

  response.status(200).json({
    servicos
  });
}

export async function getServiceByIdController(
  request: Request,
  response: Response
): Promise<void> {
  const parsedParams =
    serviceIdParamSchema.safeParse(
      request.params
    );

  if (!parsedParams.success) {
    response.status(400).json({
      error:
        "INVALID_SERVICE_ID",
      message:
        "ID de serviço inválido."
    });

    return;
  }

  const servico =
    await getServiceById(
      parsedParams.data.id
    );

  if (!servico) {
    response.status(404).json({
      error:
        "SERVICE_NOT_FOUND",
      message:
        "Serviço tecnológico não encontrado."
    });

    return;
  }

  response.status(200).json({
    servico
  });
}

export async function createServiceController(
  request: Request,
  response: Response
): Promise<void> {
  const parsedBody =
    createServiceSchema.safeParse(
      request.body
    );

  if (!parsedBody.success) {
    response.status(400).json({
      error:
        "VALIDATION_ERROR",
      message:
        "Dados do serviço inválidos.",
      details:
        parsedBody.error.flatten()
          .fieldErrors
    });

    return;
  }

  const result =
    await createService(
      parsedBody.data
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
            "Não é possível criar serviço para contrato de cliente inativo."
        });

        return;

      case "CONTRACT_NOT_ACTIVE":
        response.status(409).json({
          error:
            "CONTRACT_NOT_ACTIVE",
          message:
            "Não é possível criar serviço para um contrato que não esteja ativo."
        });

        return;

      case "CONTRACT_EXPIRED":
        response.status(409).json({
          error:
            "CONTRACT_EXPIRED",
          message:
            "Não é possível criar serviço para um contrato vencido."
        });

        return;

      case "SERVICE_ALREADY_EXISTS":
        response.status(409).json({
          error:
            "SERVICE_ALREADY_EXISTS",
          message:
            "Já existe um serviço com este nome vinculado ao contrato."
        });

        return;
    }
  }

  response.status(201).json({
    message:
      "Serviço tecnológico criado com sucesso.",
    servico:
      result.servico
  });
}

export async function updateServiceController(
  request: Request,
  response: Response
): Promise<void> {
  const parsedParams =
    serviceIdParamSchema.safeParse(
      request.params
    );

  if (!parsedParams.success) {
    response.status(400).json({
      error:
        "INVALID_SERVICE_ID",
      message:
        "ID de serviço inválido."
    });

    return;
  }

  const parsedBody =
    updateServiceSchema.safeParse(
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
    await updateService(
      parsedParams.data.id,
      parsedBody.data
    );

  if (!result.success) {
    switch (result.reason) {
      case "SERVICE_NOT_FOUND":
        response.status(404).json({
          error:
            "SERVICE_NOT_FOUND",
          message:
            "Serviço tecnológico não encontrado."
        });

        return;

      case "SERVICE_ALREADY_EXISTS":
        response.status(409).json({
          error:
            "SERVICE_ALREADY_EXISTS",
          message:
            "Já existe um serviço com este nome vinculado ao contrato."
        });

        return;

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
            "Não é possível vincular o serviço a contrato de cliente inativo."
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
    }
  }

  response.status(200).json({
    message:
      "Serviço tecnológico atualizado com sucesso.",
    servico:
      result.servico
  });
}

export async function updateServiceStatusController(
  request: Request,
  response: Response
): Promise<void> {
  const parsedParams =
    serviceIdParamSchema.safeParse(
      request.params
    );

  if (!parsedParams.success) {
    response.status(400).json({
      error:
        "INVALID_SERVICE_ID",
      message:
        "ID de serviço inválido."
    });

    return;
  }

  const parsedBody =
    updateServiceStatusSchema.safeParse(
      request.body
    );

  if (!parsedBody.success) {
    response.status(400).json({
      error:
        "VALIDATION_ERROR",
      message:
        "Status do serviço inválido.",
      details:
        parsedBody.error.flatten()
          .fieldErrors
    });

    return;
  }

  const result =
    await updateServiceStatus(
      parsedParams.data.id,
      parsedBody.data.status
    );

  if (!result.success) {
    switch (result.reason) {
      case "SERVICE_NOT_FOUND":
        response.status(404).json({
          error:
            "SERVICE_NOT_FOUND",
          message:
            "Serviço tecnológico não encontrado."
        });

        return;

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
            "Não é possível ativar o serviço enquanto o cliente estiver inativo."
        });

        return;

      case "CONTRACT_NOT_ACTIVE":
        response.status(409).json({
          error:
            "CONTRACT_NOT_ACTIVE",
          message:
            "Não é possível ativar o serviço enquanto o contrato não estiver ativo."
        });

        return;

      case "CONTRACT_EXPIRED":
        response.status(409).json({
          error:
            "CONTRACT_EXPIRED",
          message:
            "Não é possível ativar o serviço porque o contrato está vencido."
        });

        return;
    }
  }

  response.status(200).json({
    message:
      "Status do serviço tecnológico atualizado com sucesso.",
    servico:
      result.servico
  });
}