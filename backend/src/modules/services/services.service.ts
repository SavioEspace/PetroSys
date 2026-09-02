import { prisma } from "../../config/prisma.js";

import type {
  CreateServiceInput,
  UpdateServiceInput
} from "./services.schema.js";

const serviceSelect = {
  id: true,
  nome: true,
  descricao: true,
  categoria: true,
  status: true,
  createdAt: true,
  updatedAt: true,

  contrato: {
    select: {
      id: true,
      numero: true,
      objeto: true,
      dataInicio: true,
      dataFim: true,
      status: true,

      cliente: {
        select: {
          id: true,
          razaoSocial: true,
          nomeFantasia: true,
          ativo: true
        }
      }
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

  const agora = new Date();

  const hojeUtc = new Date(
    Date.UTC(
      agora.getUTCFullYear(),
      agora.getUTCMonth(),
      agora.getUTCDate()
    )
  );

  return dataFim < hojeUtc;
}

function serializeService<
  T extends {
    contrato: {
      dataFim: Date;
      status: string;
    };
  }
>(servico: T) {
  return {
    ...servico,

    contrato: {
      ...servico.contrato,

      vencido: isContractExpired(
        servico.contrato.dataFim,
        servico.contrato.status
      )
    }
  };
}

async function validateContractForService(
  contratoId: number
) {
  const contrato =
    await prisma.contrato.findUnique({
      where: {
        id: contratoId
      },

      include: {
        cliente: true
      }
    });

  if (!contrato) {
    return {
      success: false as const,
      reason:
        "CONTRACT_NOT_FOUND" as const
    };
  }

  if (!contrato.cliente.ativo) {
    return {
      success: false as const,
      reason:
        "CLIENT_INACTIVE" as const
    };
  }

  if (contrato.status !== "ATIVO") {
    return {
      success: false as const,
      reason:
        "CONTRACT_NOT_ACTIVE" as const
    };
  }

  if (
    isContractExpired(
      contrato.dataFim,
      contrato.status
    )
  ) {
    return {
      success: false as const,
      reason:
        "CONTRACT_EXPIRED" as const
    };
  }

  return {
    success: true as const,
    contrato
  };
}

export async function listServices() {
  const servicos =
    await prisma.servicoTecnologico.findMany({
      orderBy: {
        createdAt: "desc"
      },

      select: serviceSelect
    });

  return servicos.map(
    serializeService
  );
}

export async function getServiceById(
  id: number
) {
  const servico =
    await prisma.servicoTecnologico.findUnique({
      where: {
        id
      },

      select: serviceSelect
    });

  if (!servico) {
    return null;
  }

  return serializeService(
    servico
  );
}

export async function createService(
  input: CreateServiceInput
) {
  const validacaoContrato =
    await validateContractForService(
      input.contratoId
    );

  if (!validacaoContrato.success) {
    return {
      success: false as const,
      reason:
        validacaoContrato.reason
    };
  }

  const servicoExistente =
    await prisma.servicoTecnologico.findUnique({
      where: {
        contratoId_nome: {
          contratoId:
            input.contratoId,

          nome:
            input.nome
        }
      }
    });

  if (servicoExistente) {
    return {
      success: false as const,
      reason:
        "SERVICE_ALREADY_EXISTS" as const
    };
  }

  const servico =
    await prisma.servicoTecnologico.create({
      data: {
        nome:
          input.nome,

        descricao:
          input.descricao,

        categoria:
          input.categoria,

        status:
          input.status,

        contratoId:
          input.contratoId
      },

      select: serviceSelect
    });

  return {
    success: true as const,
    servico:
      serializeService(servico)
  };
}

export async function updateService(
  id: number,
  input: UpdateServiceInput
) {
  const servicoAtual =
    await prisma.servicoTecnologico.findUnique({
      where: {
        id
      }
    });

  if (!servicoAtual) {
    return {
      success: false as const,
      reason:
        "SERVICE_NOT_FOUND" as const
    };
  }

  const contratoIdFinal =
    input.contratoId ??
    servicoAtual.contratoId;

  const nomeFinal =
    input.nome ??
    servicoAtual.nome;

  if (
    input.contratoId !== undefined &&
    input.contratoId !==
      servicoAtual.contratoId
  ) {
    const validacaoContrato =
      await validateContractForService(
        input.contratoId
      );

    if (!validacaoContrato.success) {
      return {
        success: false as const,
        reason:
          validacaoContrato.reason
      };
    }
  }

  const identificacaoMudou =
    contratoIdFinal !==
      servicoAtual.contratoId ||
    nomeFinal !==
      servicoAtual.nome;

  if (identificacaoMudou) {
    const servicoExistente =
      await prisma.servicoTecnologico.findUnique({
        where: {
          contratoId_nome: {
            contratoId:
              contratoIdFinal,

            nome:
              nomeFinal
          }
        }
      });

    if (
      servicoExistente &&
      servicoExistente.id !== id
    ) {
      return {
        success: false as const,
        reason:
          "SERVICE_ALREADY_EXISTS" as const
      };
    }
  }

  const servico =
    await prisma.servicoTecnologico.update({
      where: {
        id
      },

      data: {
        ...(input.nome !==
          undefined && {
          nome:
            input.nome
        }),

        ...(input.descricao !==
          undefined && {
          descricao:
            input.descricao
        }),

        ...(input.categoria !==
          undefined && {
          categoria:
            input.categoria
        }),

        ...(input.contratoId !==
          undefined && {
          contratoId:
            input.contratoId
        })
      },

      select: serviceSelect
    });

  return {
    success: true as const,
    servico:
      serializeService(servico)
  };
}

export async function updateServiceStatus(
  id: number,
  status:
    | "ATIVO"
    | "SUSPENSO"
    | "ENCERRADO"
) {
  const servicoAtual =
    await prisma.servicoTecnologico.findUnique({
      where: {
        id
      }
    });

  if (!servicoAtual) {
    return {
      success: false as const,
      reason:
        "SERVICE_NOT_FOUND" as const
    };
  }

  if (status === "ATIVO") {
    const validacaoContrato =
      await validateContractForService(
        servicoAtual.contratoId
      );

    if (!validacaoContrato.success) {
      return {
        success: false as const,
        reason:
          validacaoContrato.reason
      };
    }
  }

  const servico =
    await prisma.servicoTecnologico.update({
      where: {
        id
      },

      data: {
        status
      },

      select: serviceSelect
    });

  return {
    success: true as const,
    servico:
      serializeService(servico)
  };
}