import { prisma } from "../../config/prisma.js";

import type {
  CreateContractInput,
  UpdateContractInput
} from "./contracts.schema.js";

const contractSelect = {
  id: true,
  numero: true,
  objeto: true,
  dataInicio: true,
  dataFim: true,
  status: true,
  observacoes: true,
  createdAt: true,
  updatedAt: true,

  cliente: {
    select: {
      id: true,
      razaoSocial: true,
      nomeFantasia: true,
      cnpj: true,
      ativo: true
    }
  }
} as const;

function isContractExpired(
  dataFim: Date,
  status: string
): boolean {
  if (status === "ENCERRADO") {
    return false;
  }

  const hoje = new Date();

  const hojeUtc = new Date(
    Date.UTC(
      hoje.getUTCFullYear(),
      hoje.getUTCMonth(),
      hoje.getUTCDate()
    )
  );

  return dataFim < hojeUtc;
}

function serializeContract<
  T extends {
    dataFim: Date;
    status: string;
  }
>(contrato: T) {
  return {
    ...contrato,

    vencido: isContractExpired(
      contrato.dataFim,
      contrato.status
    )
  };
}

function parseDate(
  value: string
): Date {
  return new Date(
    `${value}T00:00:00.000Z`
  );
}

export async function listContracts() {
  const contratos =
    await prisma.contrato.findMany({
      orderBy: {
        createdAt: "desc"
      },

      select: contractSelect
    });

  return contratos.map(
    serializeContract
  );
}

export async function getContractById(
  id: number
) {
  const contrato =
    await prisma.contrato.findUnique({
      where: {
        id
      },

      select: contractSelect
    });

  if (!contrato) {
    return null;
  }

  return serializeContract(
    contrato
  );
}

export async function createContract(
  input: CreateContractInput
) {
  const contratoExistente =
    await prisma.contrato.findUnique({
      where: {
        numero: input.numero
      }
    });

  if (contratoExistente) {
    return {
      success: false as const,
      reason:
        "CONTRACT_NUMBER_ALREADY_EXISTS" as const
    };
  }

  const cliente =
    await prisma.cliente.findUnique({
      where: {
        id: input.clienteId
      }
    });

  if (!cliente) {
    return {
      success: false as const,
      reason:
        "CLIENT_NOT_FOUND" as const
    };
  }

  if (!cliente.ativo) {
    return {
      success: false as const,
      reason:
        "CLIENT_INACTIVE" as const
    };
  }

  const contrato =
    await prisma.contrato.create({
      data: {
        numero:
          input.numero,

        objeto:
          input.objeto,

        dataInicio:
          parseDate(
            input.dataInicio
          ),

        dataFim:
          parseDate(
            input.dataFim
          ),

        status:
          input.status,

        observacoes:
          input.observacoes,

        clienteId:
          input.clienteId
      },

      select: contractSelect
    });

  return {
    success: true as const,
    contrato:
      serializeContract(contrato)
  };
}

export async function updateContract(
  id: number,
  input: UpdateContractInput
) {
  const contratoAtual =
    await prisma.contrato.findUnique({
      where: {
        id
      }
    });

  if (!contratoAtual) {
    return {
      success: false as const,
      reason:
        "CONTRACT_NOT_FOUND" as const
    };
  }

  if (
    input.numero &&
    input.numero !==
      contratoAtual.numero
  ) {
    const numeroEmUso =
      await prisma.contrato.findUnique({
        where: {
          numero: input.numero
        }
      });

    if (numeroEmUso) {
      return {
        success: false as const,
        reason:
          "CONTRACT_NUMBER_ALREADY_EXISTS" as const
      };
    }
  }

  if (
    input.clienteId !== undefined &&
    input.clienteId !==
      contratoAtual.clienteId
  ) {
    const cliente =
      await prisma.cliente.findUnique({
        where: {
          id: input.clienteId
        }
      });

    if (!cliente) {
      return {
        success: false as const,
        reason:
          "CLIENT_NOT_FOUND" as const
      };
    }

    if (!cliente.ativo) {
      return {
        success: false as const,
        reason:
          "CLIENT_INACTIVE" as const
      };
    }
  }

  const novaDataInicio =
    input.dataInicio
      ? parseDate(input.dataInicio)
      : contratoAtual.dataInicio;

  const novaDataFim =
    input.dataFim
      ? parseDate(input.dataFim)
      : contratoAtual.dataFim;

  if (
    novaDataFim <
    novaDataInicio
  ) {
    return {
      success: false as const,
      reason:
        "INVALID_DATE_RANGE" as const
    };
  }

  const contrato =
    await prisma.contrato.update({
      where: {
        id
      },

      data: {
        ...(input.numero !==
          undefined && {
          numero:
            input.numero
        }),

        ...(input.objeto !==
          undefined && {
          objeto:
            input.objeto
        }),

        ...(input.dataInicio !==
          undefined && {
          dataInicio:
            novaDataInicio
        }),

        ...(input.dataFim !==
          undefined && {
          dataFim:
            novaDataFim
        }),

        ...(input.observacoes !==
          undefined && {
          observacoes:
            input.observacoes
        }),

        ...(input.clienteId !==
          undefined && {
          clienteId:
            input.clienteId
        })
      },

      select: contractSelect
    });

  return {
    success: true as const,
    contrato:
      serializeContract(contrato)
  };
}

export async function updateContractStatus(
  id: number,
  status:
    "ATIVO" |
    "SUSPENSO" |
    "ENCERRADO"
) {
  const contratoAtual =
    await prisma.contrato.findUnique({
      where: {
        id
      }
    });

  if (!contratoAtual) {
    return {
      success: false as const,
      reason:
        "CONTRACT_NOT_FOUND" as const
    };
  }

  const contrato =
    await prisma.contrato.update({
      where: {
        id
      },

      data: {
        status
      },

      select: contractSelect
    });

  return {
    success: true as const,
    contrato:
      serializeContract(contrato)
  };
}