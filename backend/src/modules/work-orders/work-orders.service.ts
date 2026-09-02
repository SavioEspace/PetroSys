import { prisma } from "../../config/prisma.js";

import type {
  CreateWorkOrderInput,
  UpdateWorkOrderInput
} from "./work-orders.schema.js";

type WorkOrderStatus =
  | "ABERTA"
  | "EM_ANDAMENTO"
  | "BLOQUEADA"
  | "CONCLUIDA"
  | "CANCELADA";

const workOrderSelect = {
  id: true,
  codigo: true,
  titulo: true,
  descricao: true,
  prioridade: true,
  status: true,
  dataAbertura: true,
  prazo: true,
  dataConclusao: true,
  createdAt: true,
  updatedAt: true,

  contrato: {
    select: {
      id: true,
      numero: true,
      status: true,
      dataInicio: true,
      dataFim: true,

      cliente: {
        select: {
          id: true,
          razaoSocial: true,
          nomeFantasia: true,
          ativo: true
        }
      }
    }
  },

  servico: {
    select: {
      id: true,
      nome: true,
      categoria: true,
      status: true
    }
  },

  responsavel: {
    select: {
      id: true,
      nome: true,
      email: true,
      ativo: true,

      perfil: {
        select: {
          nome: true
        }
      }
    }
  },

  criadoPor: {
    select: {
      id: true,
      nome: true,
      email: true
    }
  },

  historicos: {
    orderBy: {
      createdAt: "asc"
    },

    select: {
      id: true,
      statusAnterior: true,
      statusNovo: true,
      observacao: true,
      createdAt: true,

      usuario: {
        select: {
          id: true,
          nome: true
        }
      }
    }
  }
} as const;

function hojeUtc(): Date {
  const agora = new Date();

  return new Date(
    Date.UTC(
      agora.getUTCFullYear(),
      agora.getUTCMonth(),
      agora.getUTCDate()
    )
  );
}

function parseDate(
  value: string
): Date {
  return new Date(
    `${value}T00:00:00.000Z`
  );
}

function isContractExpired(
  dataFim: Date,
  status: string
): boolean {
  if (status === "ENCERRADO") {
    return false;
  }

  return dataFim < hojeUtc();
}

function isWorkOrderOverdue(
  prazo: Date,
  status: string
): boolean {
  if (
    status === "CONCLUIDA" ||
    status === "CANCELADA"
  ) {
    return false;
  }

  return prazo < hojeUtc();
}

function serializeWorkOrder<
  T extends {
    prazo: Date;
    status: string;
  }
>(ordem: T) {
  return {
    ...ordem,

    atrasada:
      isWorkOrderOverdue(
        ordem.prazo,
        ordem.status
      )
  };
}

function isUniqueConstraintError(
  error: unknown
): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as {
      code?: string;
    }).code === "P2002"
  );
}

function isValidStatusTransition(
  statusAtual: WorkOrderStatus,
  novoStatus: WorkOrderStatus
): boolean {
  const transicoes: Record<
    WorkOrderStatus,
    WorkOrderStatus[]
  > = {
    ABERTA: [
      "EM_ANDAMENTO",
      "CANCELADA"
    ],

    EM_ANDAMENTO: [
      "BLOQUEADA",
      "CONCLUIDA",
      "CANCELADA"
    ],

    BLOQUEADA: [
      "EM_ANDAMENTO",
      "CANCELADA"
    ],

    CONCLUIDA: [],

    CANCELADA: []
  };

  return transicoes[
    statusAtual
  ].includes(novoStatus);
}

async function generateWorkOrderCode(
  tx: any
) {
  const ano =
    new Date().getUTCFullYear();

  const prefixo =
    `OS-${ano}-`;

  const ultimaOrdem =
    await tx.ordemServico.findFirst({
      where: {
        codigo: {
          startsWith: prefixo
        }
      },

      orderBy: {
        codigo: "desc"
      },

      select: {
        codigo: true
      }
    });

  let proximoNumero = 1;

  if (ultimaOrdem) {
    const numeroAtual =
      Number(
        ultimaOrdem.codigo.slice(
          prefixo.length
        )
      );

    if (
      Number.isInteger(
        numeroAtual
      )
    ) {
      proximoNumero =
        numeroAtual + 1;
    }
  }

  if (
    proximoNumero > 999999
  ) {
    throw new Error(
      "WORK_ORDER_CODE_LIMIT_REACHED"
    );
  }

  return (
    prefixo +
    String(proximoNumero)
      .padStart(6, "0")
  );
}

export async function listWorkOrders(
  userId: number,
  perfil: string
) {
  const ordens =
    await prisma.ordemServico.findMany({
      where:
        perfil === "TECNICO"
          ? {
              responsavelId:
                userId
            }
          : undefined,

      orderBy: {
        createdAt: "desc"
      },

      select: workOrderSelect
    });

  return ordens.map(
    serializeWorkOrder
  );
}

export async function getWorkOrderById(
  id: number,
  userId: number,
  perfil: string
) {
  const ordem =
    await prisma.ordemServico.findUnique({
      where: {
        id
      },

      select: workOrderSelect
    });

  if (!ordem) {
    return {
      success: false as const,
      reason:
        "WORK_ORDER_NOT_FOUND" as const
    };
  }

  if (
    perfil === "TECNICO" &&
    ordem.responsavel.id !==
      userId
  ) {
    return {
      success: false as const,
      reason:
        "FORBIDDEN" as const
    };
  }

  return {
    success: true as const,
    ordem:
      serializeWorkOrder(ordem)
  };
}

export async function createWorkOrder(
  input: CreateWorkOrderInput,
  criadoPorId: number
) {
  const [
    contrato,
    servico,
    responsavel
  ] = await Promise.all([
    prisma.contrato.findUnique({
      where: {
        id: input.contratoId
      },

      include: {
        cliente: true
      }
    }),

    prisma.servicoTecnologico.findUnique({
      where: {
        id: input.servicoId
      }
    }),

    prisma.usuario.findUnique({
      where: {
        id: input.responsavelId
      },

      include: {
        perfil: true
      }
    })
  ]);

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

  if (
    contrato.status !== "ATIVO"
  ) {
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

  if (!servico) {
    return {
      success: false as const,
      reason:
        "SERVICE_NOT_FOUND" as const
    };
  }

  if (
    servico.contratoId !==
    contrato.id
  ) {
    return {
      success: false as const,
      reason:
        "SERVICE_CONTRACT_MISMATCH" as const
    };
  }

  if (
    servico.status !== "ATIVO"
  ) {
    return {
      success: false as const,
      reason:
        "SERVICE_NOT_ACTIVE" as const
    };
  }

  if (!responsavel) {
    return {
      success: false as const,
      reason:
        "RESPONSIBLE_NOT_FOUND" as const
    };
  }

  if (!responsavel.ativo) {
    return {
      success: false as const,
      reason:
        "RESPONSIBLE_INACTIVE" as const
    };
  }

  if (
    responsavel.perfil.nome !==
    "TECNICO"
  ) {
    return {
      success: false as const,
      reason:
        "RESPONSIBLE_NOT_TECHNICIAN" as const
    };
  }

  const prazo =
    parseDate(input.prazo);

  if (
    prazo < hojeUtc()
  ) {
    return {
      success: false as const,
      reason:
        "DEADLINE_IN_PAST" as const
    };
  }

  for (
    let tentativa = 1;
    tentativa <= 5;
    tentativa++
  ) {
    try {
      const ordem =
        await prisma.$transaction(
          async (tx) => {
            const codigo =
              await generateWorkOrderCode(
                tx
              );

            const criada =
              await tx.ordemServico.create({
                data: {
                  codigo,

                  titulo:
                    input.titulo,

                  descricao:
                    input.descricao,

                  prioridade:
                    input.prioridade,

                  status:
                    "ABERTA",

                  prazo,

                  contratoId:
                    input.contratoId,

                  servicoId:
                    input.servicoId,

                  responsavelId:
                    input.responsavelId,

                  criadoPorId
                },

                select: {
                  id: true
                }
              });

            await tx.historicoStatus.create({
              data: {
                ordemServicoId:
                  criada.id,

                usuarioId:
                  criadoPorId,

                statusAnterior:
                  null,

                statusNovo:
                  "ABERTA",

                observacao:
                  "Ordem de serviço criada."
              }
            });

            return tx.ordemServico.findUnique({
              where: {
                id: criada.id
              },

              select:
                workOrderSelect
            });
          }
        );

      if (!ordem) {
        throw new Error(
          "WORK_ORDER_NOT_FOUND_AFTER_CREATE"
        );
      }

      return {
        success: true as const,
        ordem:
          serializeWorkOrder(
            ordem
          )
      };
    } catch (error) {
      if (
        isUniqueConstraintError(
          error
        ) &&
        tentativa < 5
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new Error(
    "WORK_ORDER_CODE_GENERATION_FAILED"
  );
}

export async function updateWorkOrder(
  id: number,
  input: UpdateWorkOrderInput
) {
  const ordemAtual =
    await prisma.ordemServico.findUnique({
      where: {
        id
      }
    });

  if (!ordemAtual) {
    return {
      success: false as const,
      reason:
        "WORK_ORDER_NOT_FOUND" as const
    };
  }

  if (
    input.responsavelId !==
    undefined &&
    input.responsavelId !==
      ordemAtual.responsavelId
  ) {
    const responsavel =
      await prisma.usuario.findUnique({
        where: {
          id: input.responsavelId
        },

        include: {
          perfil: true
        }
      });

    if (!responsavel) {
      return {
        success: false as const,
        reason:
          "RESPONSIBLE_NOT_FOUND" as const
      };
    }

    if (!responsavel.ativo) {
      return {
        success: false as const,
        reason:
          "RESPONSIBLE_INACTIVE" as const
      };
    }

    if (
      responsavel.perfil.nome !==
      "TECNICO"
    ) {
      return {
        success: false as const,
        reason:
          "RESPONSIBLE_NOT_TECHNICIAN" as const
      };
    }
  }

  let novoPrazo:
    Date | undefined;

  if (
    input.prazo !== undefined
  ) {
    novoPrazo =
      parseDate(input.prazo);

    if (
      novoPrazo < hojeUtc()
    ) {
      return {
        success: false as const,
        reason:
          "DEADLINE_IN_PAST" as const
      };
    }
  }

  const ordem =
    await prisma.ordemServico.update({
      where: {
        id
      },

      data: {
        ...(input.titulo !==
          undefined && {
          titulo:
            input.titulo
        }),

        ...(input.descricao !==
          undefined && {
          descricao:
            input.descricao
        }),

        ...(input.prioridade !==
          undefined && {
          prioridade:
            input.prioridade
        }),

        ...(novoPrazo !==
          undefined && {
          prazo:
            novoPrazo
        }),

        ...(input.responsavelId !==
          undefined && {
          responsavelId:
            input.responsavelId
        })
      },

      select:
        workOrderSelect
    });

  return {
    success: true as const,
    ordem:
      serializeWorkOrder(ordem)
  };
}

export async function updateWorkOrderStatus(
  id: number,
  novoStatus: WorkOrderStatus,
  observacao: string | undefined,
  usuarioId: number,
  perfil: string
) {
  const ordemAtual =
    await prisma.ordemServico.findUnique({
      where: {
        id
      },

      select: {
        id: true,
        status: true,
        responsavelId: true,
        dataConclusao: true
      }
    });

  if (!ordemAtual) {
    return {
      success: false as const,
      reason:
        "WORK_ORDER_NOT_FOUND" as const
    };
  }

  if (
    perfil === "TECNICO" &&
    ordemAtual.responsavelId !==
      usuarioId
  ) {
    return {
      success: false as const,
      reason:
        "FORBIDDEN" as const
    };
  }

  const statusAtual =
    ordemAtual.status as
      WorkOrderStatus;

  if (
    !isValidStatusTransition(
      statusAtual,
      novoStatus
    )
  ) {
    return {
      success: false as const,
      reason:
        "INVALID_STATUS_TRANSITION" as const
    };
  }

  const ordem =
    await prisma.$transaction(
      async (tx) => {
        await tx.ordemServico.update({
          where: {
            id
          },

          data: {
            status:
              novoStatus,

            dataConclusao:
              novoStatus ===
              "CONCLUIDA"
                ? new Date()
                : ordemAtual
                    .dataConclusao
          }
        });

        await tx.historicoStatus.create({
          data: {
            ordemServicoId:
              id,

            usuarioId,

            statusAnterior:
              statusAtual,

            statusNovo:
              novoStatus,

            observacao
          }
        });

        return tx.ordemServico.findUnique({
          where: {
            id
          },

          select:
            workOrderSelect
        });
      }
    );

  if (!ordem) {
    throw new Error(
      "WORK_ORDER_NOT_FOUND_AFTER_UPDATE"
    );
  }

  return {
    success: true as const,
    ordem:
      serializeWorkOrder(ordem)
  };
}

export async function getWorkOrderHistory(
  id: number,
  userId: number,
  perfil: string
) {
  const ordem =
    await prisma.ordemServico.findUnique({
      where: {
        id
      },

      select: {
        id: true,
        responsavelId: true
      }
    });

  if (!ordem) {
    return {
      success: false as const,
      reason:
        "WORK_ORDER_NOT_FOUND" as const
    };
  }

  if (
    perfil === "TECNICO" &&
    ordem.responsavelId !==
      userId
  ) {
    return {
      success: false as const,
      reason:
        "FORBIDDEN" as const
    };
  }

  const historicos =
    await prisma.historicoStatus.findMany({
      where: {
        ordemServicoId:
          id
      },

      orderBy: {
        createdAt: "asc"
      },

      select: {
        id: true,
        statusAnterior: true,
        statusNovo: true,
        observacao: true,
        createdAt: true,

        usuario: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

  return {
    success: true as const,
    historicos
  };
}