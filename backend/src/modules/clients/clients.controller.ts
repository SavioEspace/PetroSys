import type {
  Request,
  Response
} from "express";

import {
  clientIdParamSchema,
  createClientSchema,
  updateClientSchema,
  updateClientStatusSchema
} from "./clients.schema.js";

import {
  createClient,
  getClientById,
  listClients,
  updateClient,
  updateClientStatus
} from "./clients.service.js";

export async function listClientsController(
  _request: Request,
  response: Response
): Promise<void> {
  const clientes =
    await listClients();

  response.status(200).json({
    clientes
  });
}

export async function getClientByIdController(
  request: Request,
  response: Response
): Promise<void> {
  const parsedParams =
    clientIdParamSchema.safeParse(
      request.params
    );

  if (!parsedParams.success) {
    response.status(400).json({
      error: "INVALID_CLIENT_ID",
      message:
        "ID de cliente inválido."
    });

    return;
  }

  const cliente =
    await getClientById(
      parsedParams.data.id
    );

  if (!cliente) {
    response.status(404).json({
      error: "CLIENT_NOT_FOUND",
      message:
        "Cliente não encontrado."
    });

    return;
  }

  response.status(200).json({
    cliente
  });
}

export async function createClientController(
  request: Request,
  response: Response
): Promise<void> {
  const parsedBody =
    createClientSchema.safeParse(
      request.body
    );

  if (!parsedBody.success) {
    response.status(400).json({
      error: "VALIDATION_ERROR",
      message:
        "Dados do cliente inválidos.",
      details:
        parsedBody.error.flatten()
          .fieldErrors
    });

    return;
  }

  const result =
    await createClient(
      parsedBody.data
    );

  if (!result.success) {
    response.status(409).json({
      error: "CNPJ_ALREADY_EXISTS",
      message:
        "Já existe um cliente cadastrado com este CNPJ."
    });

    return;
  }

  response.status(201).json({
    message:
      "Cliente criado com sucesso.",
    cliente:
      result.cliente
  });
}

export async function updateClientController(
  request: Request,
  response: Response
): Promise<void> {
  const parsedParams =
    clientIdParamSchema.safeParse(
      request.params
    );

  if (!parsedParams.success) {
    response.status(400).json({
      error: "INVALID_CLIENT_ID",
      message:
        "ID de cliente inválido."
    });

    return;
  }

  const parsedBody =
    updateClientSchema.safeParse(
      request.body
    );

  if (!parsedBody.success) {
    response.status(400).json({
      error: "VALIDATION_ERROR",
      message:
        "Dados de atualização inválidos.",
      details:
        parsedBody.error.flatten()
          .fieldErrors
    });

    return;
  }

  const result =
    await updateClient(
      parsedParams.data.id,
      parsedBody.data
    );

  if (!result.success) {
    if (
      result.reason ===
      "CLIENT_NOT_FOUND"
    ) {
      response.status(404).json({
        error: "CLIENT_NOT_FOUND",
        message:
          "Cliente não encontrado."
      });

      return;
    }

    response.status(409).json({
      error: "CNPJ_ALREADY_EXISTS",
      message:
        "Já existe um cliente cadastrado com este CNPJ."
    });

    return;
  }

  response.status(200).json({
    message:
      "Cliente atualizado com sucesso.",
    cliente:
      result.cliente
  });
}

export async function updateClientStatusController(
  request: Request,
  response: Response
): Promise<void> {
  const parsedParams =
    clientIdParamSchema.safeParse(
      request.params
    );

  if (!parsedParams.success) {
    response.status(400).json({
      error: "INVALID_CLIENT_ID",
      message:
        "ID de cliente inválido."
    });

    return;
  }

  const parsedBody =
    updateClientStatusSchema.safeParse(
      request.body
    );

  if (!parsedBody.success) {
    response.status(400).json({
      error: "VALIDATION_ERROR",
      message:
        "Status do cliente inválido.",
      details:
        parsedBody.error.flatten()
          .fieldErrors
    });

    return;
  }

  const result =
    await updateClientStatus(
      parsedParams.data.id,
      parsedBody.data.ativo
    );

  if (!result.success) {
    response.status(404).json({
      error: "CLIENT_NOT_FOUND",
      message:
        "Cliente não encontrado."
    });

    return;
  }

  response.status(200).json({
    message:
      parsedBody.data.ativo
        ? "Cliente ativado com sucesso."
        : "Cliente desativado com sucesso.",

    cliente:
      result.cliente
  });
}