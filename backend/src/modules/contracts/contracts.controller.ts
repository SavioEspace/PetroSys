import type {
  Request,
  Response
} from "express";

import {
  contractIdParamSchema,
  createContractSchema,
  updateContractSchema,
  updateContractStatusSchema
} from "./contracts.schema.js";

import {
  createContract,
  getContractById,
  listContracts,
  updateContract,
  updateContractStatus
} from "./contracts.service.js";

export async function listContractsController(
  _request: Request,
  response: Response
): Promise<void> {
  const contratos =
    await listContracts();

  response.status(200).json({
    contratos
  });
}

export async function getContractByIdController(
  request: Request,
  response: Response
): Promise<void> {
  const parsedParams =
    contractIdParamSchema.safeParse(
      request.params
    );

  if (!parsedParams.success) {
    response.status(400).json({
      error:
        "INVALID_CONTRACT_ID",
      message:
        "ID de contrato inválido."
    });

    return;
  }

  const contrato =
    await getContractById(
      parsedParams.data.id
    );

  if (!contrato) {
    response.status(404).json({
      error:
        "CONTRACT_NOT_FOUND",
      message:
        "Contrato não encontrado."
    });

    return;
  }

  response.status(200).json({
    contrato
  });
}

export async function createContractController(
  request: Request,
  response: Response
): Promise<void> {
  const parsedBody =
    createContractSchema.safeParse(
      request.body
    );

  if (!parsedBody.success) {
    response.status(400).json({
      error:
        "VALIDATION_ERROR",
      message:
        "Dados do contrato inválidos.",
      details:
        parsedBody.error.flatten()
          .fieldErrors
    });

    return;
  }

  const result =
    await createContract(
      parsedBody.data
    );

  if (!result.success) {
    switch (result.reason) {
      case "CONTRACT_NUMBER_ALREADY_EXISTS":
        response.status(409).json({
          error:
            "CONTRACT_NUMBER_ALREADY_EXISTS",
          message:
            "Já existe um contrato cadastrado com este número."
        });

        return;

      case "CLIENT_NOT_FOUND":
        response.status(404).json({
          error:
            "CLIENT_NOT_FOUND",
          message:
            "Cliente não encontrado."
        });

        return;

      case "CLIENT_INACTIVE":
        response.status(409).json({
          error:
            "CLIENT_INACTIVE",
          message:
            "Não é possível criar contrato para um cliente inativo."
        });

        return;
    }
  }

  response.status(201).json({
    message:
      "Contrato criado com sucesso.",
    contrato:
      result.contrato
  });
}

export async function updateContractController(
  request: Request,
  response: Response
): Promise<void> {
  const parsedParams =
    contractIdParamSchema.safeParse(
      request.params
    );

  if (!parsedParams.success) {
    response.status(400).json({
      error:
        "INVALID_CONTRACT_ID",
      message:
        "ID de contrato inválido."
    });

    return;
  }

  const parsedBody =
    updateContractSchema.safeParse(
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
    await updateContract(
      parsedParams.data.id,
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

      case "CONTRACT_NUMBER_ALREADY_EXISTS":
        response.status(409).json({
          error:
            "CONTRACT_NUMBER_ALREADY_EXISTS",
          message:
            "Já existe um contrato cadastrado com este número."
        });

        return;

      case "CLIENT_NOT_FOUND":
        response.status(404).json({
          error:
            "CLIENT_NOT_FOUND",
          message:
            "Cliente não encontrado."
        });

        return;

      case "CLIENT_INACTIVE":
        response.status(409).json({
          error:
            "CLIENT_INACTIVE",
          message:
            "Não é possível vincular o contrato a um cliente inativo."
        });

        return;

      case "INVALID_DATE_RANGE":
        response.status(400).json({
          error:
            "INVALID_DATE_RANGE",
          message:
            "A data final não pode ser anterior à data inicial."
        });

        return;
    }
  }

  response.status(200).json({
    message:
      "Contrato atualizado com sucesso.",
    contrato:
      result.contrato
  });
}

export async function updateContractStatusController(
  request: Request,
  response: Response
): Promise<void> {
  const parsedParams =
    contractIdParamSchema.safeParse(
      request.params
    );

  if (!parsedParams.success) {
    response.status(400).json({
      error:
        "INVALID_CONTRACT_ID",
      message:
        "ID de contrato inválido."
    });

    return;
  }

  const parsedBody =
    updateContractStatusSchema.safeParse(
      request.body
    );

  if (!parsedBody.success) {
    response.status(400).json({
      error:
        "VALIDATION_ERROR",
      message:
        "Status do contrato inválido.",
      details:
        parsedBody.error.flatten()
          .fieldErrors
    });

    return;
  }

  const result =
    await updateContractStatus(
      parsedParams.data.id,
      parsedBody.data.status
    );

  if (!result.success) {
    response.status(404).json({
      error:
        "CONTRACT_NOT_FOUND",
      message:
        "Contrato não encontrado."
    });

    return;
  }

  response.status(200).json({
    message:
      "Status do contrato atualizado com sucesso.",
    contrato:
      result.contrato
  });
}