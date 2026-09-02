import { prisma } from "../../config/prisma.js";

function getTodayUtc(): Date {
  const now = new Date();

  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    )
  );
}

function addDays(
  date: Date,
  days: number
): Date {
  const result = new Date(date);

  result.setUTCDate(
    result.getUTCDate() + days
  );

  return result;
}

function differenceInDays(
  futureDate: Date,
  currentDate: Date
): number {
  const millisecondsPerDay =
    1000 * 60 * 60 * 24;

  return Math.ceil(
    (
      futureDate.getTime() -
      currentDate.getTime()
    ) / millisecondsPerDay
  );
}

export async function getDashboardSummary() {
  const hoje =
    getTodayUtc();

  const em30Dias =
    addDays(hoje, 30);

  const [
    totalClientes,
    clientesAtivos,

    totalContratos,
    contratosAtivos,
    contratosSuspensos,
    contratosEncerrados,
    contratosVencidos,
    contratosVencendo30Dias,

    totalServicos,
    servicosAtivos,
    servicosSuspensos,
    servicosEncerrados,

    totalOrdens,
    ordensAbertas,
    ordensEmAndamento,
    ordensBloqueadas,
    ordensConcluidas,
    ordensCanceladas,
    ordensAtrasadas,

    prioridadeBaixa,
    prioridadeMedia,
    prioridadeAlta,
    prioridadeCritica,

    ordensCriticasAtivas,

    tecnicos,
    ultimasOrdens,
    proximosVencimentos
  ] = await Promise.all([
    prisma.cliente.count(),

    prisma.cliente.count({
      where: {
        ativo: true
      }
    }),

    prisma.contrato.count(),

    prisma.contrato.count({
      where: {
        status: "ATIVO"
      }
    }),

    prisma.contrato.count({
      where: {
        status: "SUSPENSO"
      }
    }),

    prisma.contrato.count({
      where: {
        status: "ENCERRADO"
      }
    }),

    prisma.contrato.count({
      where: {
        dataFim: {
          lt: hoje
        },

        status: {
          not: "ENCERRADO"
        }
      }
    }),

    prisma.contrato.count({
      where: {
        dataFim: {
          gte: hoje,
          lte: em30Dias
        },

        status: {
          not: "ENCERRADO"
        }
      }
    }),

    prisma.servicoTecnologico.count(),

    prisma.servicoTecnologico.count({
      where: {
        status: "ATIVO"
      }
    }),

    prisma.servicoTecnologico.count({
      where: {
        status: "SUSPENSO"
      }
    }),

    prisma.servicoTecnologico.count({
      where: {
        status: "ENCERRADO"
      }
    }),

    prisma.ordemServico.count(),

    prisma.ordemServico.count({
      where: {
        status: "ABERTA"
      }
    }),

    prisma.ordemServico.count({
      where: {
        status: "EM_ANDAMENTO"
      }
    }),

    prisma.ordemServico.count({
      where: {
        status: "BLOQUEADA"
      }
    }),

    prisma.ordemServico.count({
      where: {
        status: "CONCLUIDA"
      }
    }),

    prisma.ordemServico.count({
      where: {
        status: "CANCELADA"
      }
    }),

    prisma.ordemServico.count({
      where: {
        prazo: {
          lt: hoje
        },

        status: {
          notIn: [
            "CONCLUIDA",
            "CANCELADA"
          ]
        }
      }
    }),

    prisma.ordemServico.count({
      where: {
        prioridade: "BAIXA"
      }
    }),

    prisma.ordemServico.count({
      where: {
        prioridade: "MEDIA"
      }
    }),

    prisma.ordemServico.count({
      where: {
        prioridade: "ALTA"
      }
    }),

    prisma.ordemServico.count({
      where: {
        prioridade: "CRITICA"
      }
    }),

    prisma.ordemServico.count({
      where: {
        prioridade: "CRITICA",

        status: {
          notIn: [
            "CONCLUIDA",
            "CANCELADA"
          ]
        }
      }
    }),

    prisma.usuario.findMany({
      where: {
        ativo: true,

        perfil: {
          nome: "TECNICO"
        }
      },

      orderBy: {
        nome: "asc"
      },

      select: {
        id: true,
        nome: true,
        email: true,

        ordensResponsavel: {
          where: {
            status: {
              notIn: [
                "CONCLUIDA",
                "CANCELADA"
              ]
            }
          },

          select: {
            id: true,
            status: true,
            prioridade: true,
            prazo: true
          }
        }
      }
    }),

    prisma.ordemServico.findMany({
      take: 5,

      orderBy: {
        createdAt: "desc"
      },

      select: {
        id: true,
        codigo: true,
        titulo: true,
        prioridade: true,
        status: true,
        prazo: true,
        createdAt: true,

        responsavel: {
          select: {
            id: true,
            nome: true
          }
        },

        servico: {
          select: {
            id: true,
            nome: true
          }
        },

        contrato: {
          select: {
            id: true,
            numero: true,

            cliente: {
              select: {
                id: true,
                razaoSocial: true,
                nomeFantasia: true
              }
            }
          }
        }
      }
    }),

    prisma.contrato.findMany({
      where: {
        dataFim: {
          gte: hoje,
          lte: em30Dias
        },

        status: {
          not: "ENCERRADO"
        }
      },

      orderBy: {
        dataFim: "asc"
      },

      select: {
        id: true,
        numero: true,
        status: true,
        dataFim: true,

        cliente: {
          select: {
            id: true,
            razaoSocial: true,
            nomeFantasia: true
          }
        }
      }
    })
  ]);

  const cargaTecnicos =
    tecnicos.map((tecnico) => {
      const ordens =
        tecnico.ordensResponsavel;

      return {
        id:
          tecnico.id,

        nome:
          tecnico.nome,

        email:
          tecnico.email,

        totalAtivas:
          ordens.length,

        abertas:
          ordens.filter(
            (ordem) =>
              ordem.status ===
              "ABERTA"
          ).length,

        emAndamento:
          ordens.filter(
            (ordem) =>
              ordem.status ===
              "EM_ANDAMENTO"
          ).length,

        bloqueadas:
          ordens.filter(
            (ordem) =>
              ordem.status ===
              "BLOQUEADA"
          ).length,

        atrasadas:
          ordens.filter(
            (ordem) =>
              ordem.prazo < hoje
          ).length,

        criticas:
          ordens.filter(
            (ordem) =>
              ordem.prioridade ===
              "CRITICA"
          ).length
      };
    });

  const taxaConclusao =
    totalOrdens === 0
      ? 0
      : Number(
          (
            (
              ordensConcluidas /
              totalOrdens
            ) *
            100
          ).toFixed(1)
        );

  return {
    clientes: {
      total:
        totalClientes,

      ativos:
        clientesAtivos,

      inativos:
        totalClientes -
        clientesAtivos
    },

    contratos: {
      total:
        totalContratos,

      ativos:
        contratosAtivos,

      suspensos:
        contratosSuspensos,

      encerrados:
        contratosEncerrados,

      vencidos:
        contratosVencidos,

      vencemEm30Dias:
        contratosVencendo30Dias
    },

    servicos: {
      total:
        totalServicos,

      ativos:
        servicosAtivos,

      suspensos:
        servicosSuspensos,

      encerrados:
        servicosEncerrados
    },

    ordensServico: {
      total:
        totalOrdens,

      abertas:
        ordensAbertas,

      emAndamento:
        ordensEmAndamento,

      bloqueadas:
        ordensBloqueadas,

      concluidas:
        ordensConcluidas,

      canceladas:
        ordensCanceladas,

      atrasadas:
        ordensAtrasadas,

      criticasAtivas:
        ordensCriticasAtivas,

      taxaConclusao,

      prioridade: {
        baixa:
          prioridadeBaixa,

        media:
          prioridadeMedia,

        alta:
          prioridadeAlta,

        critica:
          prioridadeCritica
      }
    },

    operacao: {
      cargaTecnicos,

      ultimasOrdens:
        ultimasOrdens.map(
          (ordem) => ({
            ...ordem,

            atrasada:
              ordem.prazo < hoje &&
              ordem.status !==
                "CONCLUIDA" &&
              ordem.status !==
                "CANCELADA"
          })
        ),

      contratosProximosVencimento:
        proximosVencimentos.map(
          (contrato) => ({
            ...contrato,

            diasRestantes:
              differenceInDays(
                contrato.dataFim,
                hoje
              )
          })
        )
    }
  };
}