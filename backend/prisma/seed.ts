import "dotenv/config";

import bcrypt from "bcryptjs";

import {
  prisma
} from "../src/config/prisma.js";

type WorkOrderStatus =
  | "ABERTA"
  | "EM_ANDAMENTO"
  | "BLOQUEADA"
  | "CONCLUIDA"
  | "CANCELADA";

type WorkOrderPriority =
  | "BAIXA"
  | "MEDIA"
  | "ALTA"
  | "CRITICA";

function utcDay(
  offsetDays = 0
): Date {
  const now =
    new Date();

  const date =
    new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
      )
    );

  date.setUTCDate(
    date.getUTCDate() +
      offsetDays
  );

  return date;
}

function utcDateTime(
  offsetDays: number,
  hour: number,
  minute = 0
): Date {
  const date =
    utcDay(offsetDays);

  date.setUTCHours(
    hour,
    minute,
    0,
    0
  );

  return date;
}

async function createHistory(
  ordemServicoId: number,
  usuarioId: number,
  statusAnterior:
    WorkOrderStatus | null,
  statusNovo:
    WorkOrderStatus,
  observacao: string,
  createdAt: Date
) {
  await prisma.historicoStatus.create({
    data: {
      ordemServicoId,
      usuarioId,
      statusAnterior,
      statusNovo,
      observacao,
      createdAt
    }
  });
}

interface WorkOrderSeedData {
  codigo: string;
  titulo: string;
  descricao: string;
  prioridade:
    WorkOrderPriority;
  status:
    WorkOrderStatus;
  dataAbertura: Date;
  prazo: Date;
  dataConclusao:
    Date | null;
  contratoId: number;
  servicoId: number;
  responsavelId: number;
  criadoPorId: number;
}

async function upsertWorkOrder(
  data: WorkOrderSeedData
) {
  return prisma.ordemServico.upsert({
    where: {
      codigo:
        data.codigo
    },

    update: {
      titulo:
        data.titulo,

      descricao:
        data.descricao,

      prioridade:
        data.prioridade,

      status:
        data.status,

      dataAbertura:
        data.dataAbertura,

      prazo:
        data.prazo,

      dataConclusao:
        data.dataConclusao,

      contratoId:
        data.contratoId,

      servicoId:
        data.servicoId,

      responsavelId:
        data.responsavelId,

      criadoPorId:
        data.criadoPorId
    },

    create: data
  });
}

async function main() {
  console.log(
    "🌱 Iniciando seed demonstrativo do PetroSys..."
  );

  const year =
    new Date().getUTCFullYear();

  /*
   * PERFIS
   */

  const perfilGestor =
    await prisma.perfil.upsert({
      where: {
        nome: "GESTOR"
      },

      update: {
        descricao:
          "Perfil responsável pela administração e visão gerencial do PetroSys."
      },

      create: {
        nome: "GESTOR",

        descricao:
          "Perfil responsável pela administração e visão gerencial do PetroSys."
      }
    });

  const perfilAnalista =
    await prisma.perfil.upsert({
      where: {
        nome: "ANALISTA"
      },

      update: {
        descricao:
          "Perfil responsável pela gestão operacional de clientes, contratos, serviços e ordens."
      },

      create: {
        nome: "ANALISTA",

        descricao:
          "Perfil responsável pela gestão operacional de clientes, contratos, serviços e ordens."
      }
    });

  const perfilTecnico =
    await prisma.perfil.upsert({
      where: {
        nome: "TECNICO"
      },

      update: {
        descricao:
          "Perfil responsável pela execução e atualização das ordens de serviço atribuídas."
      },

      create: {
        nome: "TECNICO",

        descricao:
          "Perfil responsável pela execução e atualização das ordens de serviço atribuídas."
      }
    });

  /*
   * USUÁRIOS
   *
   * As senhas são redefinidas
   * pelo seed para manter o
   * ambiente demonstrativo
   * reprodutível.
   */

  const [
    gestorHash,
    analistaHash,
    carlosHash,
    marianaHash
  ] = await Promise.all([
    bcrypt.hash(
      "PetroSys@2026",
      12
    ),

    bcrypt.hash(
      "Analista@2026",
      12
    ),

    bcrypt.hash(
      "CarlosNova@2026",
      12
    ),

    bcrypt.hash(
      "MarianaNova@2026",
      12
    )
  ]);

  const gestor =
    await prisma.usuario.upsert({
      where: {
        email:
          "gestor@petrosys.local"
      },

      update: {
        nome:
          "Sávio Barros",

        senhaHash:
          gestorHash,

        ativo: true,

        perfilId:
          perfilGestor.id
      },

      create: {
        nome:
          "Sávio Barros",

        email:
          "gestor@petrosys.local",

        senhaHash:
          gestorHash,

        ativo: true,

        perfilId:
          perfilGestor.id
      }
    });

  await prisma.usuario.upsert({
    where: {
      email:
        "analista@petrosys.local"
    },

    update: {
      nome:
        "André Martins",

      senhaHash:
        analistaHash,

      ativo: true,

      perfilId:
        perfilAnalista.id
    },

    create: {
      nome:
        "André Martins",

      email:
        "analista@petrosys.local",

      senhaHash:
        analistaHash,

      ativo: true,

      perfilId:
        perfilAnalista.id
    }
  });

  const carlos =
    await prisma.usuario.upsert({
      where: {
        email:
          "tecnico@petrosys.local"
      },

      update: {
        nome:
          "Carlos Silva",

        senhaHash:
          carlosHash,

        ativo: true,

        perfilId:
          perfilTecnico.id
      },

      create: {
        nome:
          "Carlos Silva",

        email:
          "tecnico@petrosys.local",

        senhaHash:
          carlosHash,

        ativo: true,

        perfilId:
          perfilTecnico.id
      }
    });

  const mariana =
    await prisma.usuario.upsert({
      where: {
        email:
          "mariana.costa@petrosys.com.br"
      },

      update: {
        nome:
          "Mariana Costa Lima",

        senhaHash:
          marianaHash,

        ativo: true,

        perfilId:
          perfilTecnico.id
      },

      create: {
        nome:
          "Mariana Costa Lima",

        email:
          "mariana.costa@petrosys.com.br",

        senhaHash:
          marianaHash,

        ativo: true,

        perfilId:
          perfilTecnico.id
      }
    });

  /*
   * CLIENTES
   */

  const energiaAlpha =
    await prisma.cliente.upsert({
      where: {
        cnpj:
          "11222333000181"
      },

      update: {
        razaoSocial:
          "Energia Alpha Tecnologia Ltda",

        nomeFantasia:
          "Energia Alpha Tech",

        email:
          "contratos@energiaalpha.com.br",

        telefone:
          "2134001000",

        ativo: true
      },

      create: {
        razaoSocial:
          "Energia Alpha Tecnologia Ltda",

        nomeFantasia:
          "Energia Alpha Tech",

        cnpj:
          "11222333000181",

        email:
          "contratos@energiaalpha.com.br",

        telefone:
          "2134001000",

        ativo: true
      }
    });

  const nexus =
    await prisma.cliente.upsert({
      where: {
        cnpj:
          "45723174000110"
      },

      update: {
        razaoSocial:
          "Nexus Energia Digital Ltda",

        nomeFantasia:
          "Nexus Energia",

        email:
          "operacoes@nexusenergia.com.br",

        telefone:
          "2135002000",

        ativo: true
      },

      create: {
        razaoSocial:
          "Nexus Energia Digital Ltda",

        nomeFantasia:
          "Nexus Energia",

        cnpj:
          "45723174000110",

        email:
          "operacoes@nexusenergia.com.br",

        telefone:
          "2135002000",

        ativo: true
      }
    });

  const gridNova =
    await prisma.cliente.upsert({
      where: {
        cnpj:
          "61895042000122"
      },

      update: {
        razaoSocial:
          "GridNova Soluções Energéticas Ltda",

        nomeFantasia:
          "GridNova",

        email:
          "contato@gridnova.com.br",

        telefone:
          "2136003000",

        ativo: false
      },

      create: {
        razaoSocial:
          "GridNova Soluções Energéticas Ltda",

        nomeFantasia:
          "GridNova",

        cnpj:
          "61895042000122",

        email:
          "contato@gridnova.com.br",

        telefone:
          "2136003000",

        ativo: false
      }
    });

  /*
   * CONTRATOS
   */

  const contratoAlpha =
    await prisma.contrato.upsert({
      where: {
        numero:
          `CTR-${year}-010`
      },

      update: {
        objeto:
          "Prestação de serviços de monitoramento, sustentação e gestão da infraestrutura tecnológica.",

        dataInicio:
          utcDay(-120),

        dataFim:
          utcDay(18),

        status: "ATIVO",

        observacoes:
          "Contrato estratégico próximo do vencimento para demonstração do acompanhamento gerencial.",

        clienteId:
          energiaAlpha.id
      },

      create: {
        numero:
          `CTR-${year}-010`,

        objeto:
          "Prestação de serviços de monitoramento, sustentação e gestão da infraestrutura tecnológica.",

        dataInicio:
          utcDay(-120),

        dataFim:
          utcDay(18),

        status: "ATIVO",

        observacoes:
          "Contrato estratégico próximo do vencimento para demonstração do acompanhamento gerencial.",

        clienteId:
          energiaAlpha.id
      }
    });

  const contratoNexus =
    await prisma.contrato.upsert({
      where: {
        numero:
          `CTR-${year}-011`
      },

      update: {
        objeto:
          "Sustentação de aplicações corporativas e serviços de segurança operacional.",

        dataInicio:
          utcDay(-60),

        dataFim:
          utcDay(240),

        status: "ATIVO",

        observacoes:
          "Contrato vigente utilizado no cenário demonstrativo do PetroSys.",

        clienteId:
          nexus.id
      },

      create: {
        numero:
          `CTR-${year}-011`,

        objeto:
          "Sustentação de aplicações corporativas e serviços de segurança operacional.",

        dataInicio:
          utcDay(-60),

        dataFim:
          utcDay(240),

        status: "ATIVO",

        observacoes:
          "Contrato vigente utilizado no cenário demonstrativo do PetroSys.",

        clienteId:
          nexus.id
      }
    });

  const contratoGridNova =
    await prisma.contrato.upsert({
      where: {
        numero:
          `CTR-${year}-012`
      },

      update: {
        objeto:
          "Serviços especializados de integração de ambientes tecnológicos.",

        dataInicio:
          utcDay(-90),

        dataFim:
          utcDay(120),

        status:
          "SUSPENSO",

        observacoes:
          "Contrato suspenso associado a cliente inativo para demonstração das regras de integridade.",

        clienteId:
          gridNova.id
      },

      create: {
        numero:
          `CTR-${year}-012`,

        objeto:
          "Serviços especializados de integração de ambientes tecnológicos.",

        dataInicio:
          utcDay(-90),

        dataFim:
          utcDay(120),

        status:
          "SUSPENSO",

        observacoes:
          "Contrato suspenso associado a cliente inativo para demonstração das regras de integridade.",

        clienteId:
          gridNova.id
      }
    });

  /*
   * SERVIÇOS TECNOLÓGICOS
   */

  const monitoramento =
    await prisma.servicoTecnologico.upsert({
      where: {
        contratoId_nome: {
          contratoId:
            contratoAlpha.id,

          nome:
            "Monitoramento de Infraestrutura"
        }
      },

      update: {
        descricao:
          "Monitoramento contínuo da disponibilidade, capacidade e eventos da infraestrutura tecnológica.",

        categoria:
          "Infraestrutura",

        status:
          "ATIVO"
      },

      create: {
        nome:
          "Monitoramento de Infraestrutura",

        descricao:
          "Monitoramento contínuo da disponibilidade, capacidade e eventos da infraestrutura tecnológica.",

        categoria:
          "Infraestrutura",

        status:
          "ATIVO",

        contratoId:
          contratoAlpha.id
      }
    });

  const sustentacaoInfra =
    await prisma.servicoTecnologico.upsert({
      where: {
        contratoId_nome: {
          contratoId:
            contratoAlpha.id,

          nome:
            "Sustentação de Infraestrutura"
        }
      },

      update: {
        descricao:
          "Sustentação técnica e tratamento de ocorrências relacionadas ao ambiente de infraestrutura.",

        categoria:
          "Infraestrutura",

        status:
          "ATIVO"
      },

      create: {
        nome:
          "Sustentação de Infraestrutura",

        descricao:
          "Sustentação técnica e tratamento de ocorrências relacionadas ao ambiente de infraestrutura.",

        categoria:
          "Infraestrutura",

        status:
          "ATIVO",

        contratoId:
          contratoAlpha.id
      }
    });

  const aplicacoes =
    await prisma.servicoTecnologico.upsert({
      where: {
        contratoId_nome: {
          contratoId:
            contratoNexus.id,

          nome:
            "Gestão de Aplicações Corporativas"
        }
      },

      update: {
        descricao:
          "Sustentação, acompanhamento e gestão operacional de aplicações corporativas.",

        categoria:
          "Aplicações",

        status:
          "ATIVO"
      },

      create: {
        nome:
          "Gestão de Aplicações Corporativas",

        descricao:
          "Sustentação, acompanhamento e gestão operacional de aplicações corporativas.",

        categoria:
          "Aplicações",

        status:
          "ATIVO",

        contratoId:
          contratoNexus.id
      }
    });

  const seguranca =
    await prisma.servicoTecnologico.upsert({
      where: {
        contratoId_nome: {
          contratoId:
            contratoNexus.id,

          nome:
            "Segurança Operacional"
        }
      },

      update: {
        descricao:
          "Acompanhamento de eventos de segurança e tratamento operacional de ocorrências.",

        categoria:
          "Segurança",

        status:
          "ATIVO"
      },

      create: {
        nome:
          "Segurança Operacional",

        descricao:
          "Acompanhamento de eventos de segurança e tratamento operacional de ocorrências.",

        categoria:
          "Segurança",

        status:
          "ATIVO",

        contratoId:
          contratoNexus.id
      }
    });

  await prisma.servicoTecnologico.upsert({
    where: {
      contratoId_nome: {
        contratoId:
          contratoGridNova.id,

        nome:
          "Integração de Ambientes"
      }
    },

    update: {
      descricao:
        "Integração entre ambientes tecnológicos corporativos.",

      categoria:
        "Integração",

      status:
        "SUSPENSO"
    },

    create: {
      nome:
        "Integração de Ambientes",

      descricao:
        "Integração entre ambientes tecnológicos corporativos.",

      categoria:
        "Integração",

      status:
        "SUSPENSO",

      contratoId:
        contratoGridNova.id
    }
  });

  /*
   * ORDENS DE SERVIÇO
   *
   * Criamos diferentes estados
   * para enriquecer o Dashboard
   * e a demonstração da banca.
   */

  const osConcluida =
    await upsertWorkOrder({
      codigo:
        `OS-${year}-000010`,

      titulo:
        "Normalizar indisponibilidade crítica do ambiente",

      descricao:
        "Investigar indisponibilidade identificada no ambiente, validar causa raiz e executar normalização operacional.",

      prioridade:
        "CRITICA",

      status:
        "CONCLUIDA",

      dataAbertura:
        utcDateTime(
          -12,
          9
        ),

      prazo:
        utcDay(-7),

      dataConclusao:
        utcDateTime(
          -8,
          15,
          30
        ),

      contratoId:
        contratoAlpha.id,

      servicoId:
        monitoramento.id,

      responsavelId:
        carlos.id,

      criadoPorId:
        gestor.id
    });

  const osAndamento =
    await upsertWorkOrder({
      codigo:
        `OS-${year}-000011`,

      titulo:
        "Analisar degradação de desempenho da infraestrutura",

      descricao:
        "Analisar indicadores de desempenho, identificar componentes afetados e registrar diagnóstico técnico.",

      prioridade:
        "ALTA",

      status:
        "EM_ANDAMENTO",

      dataAbertura:
        utcDateTime(
          -4,
          10
        ),

      prazo:
        utcDay(3),

      dataConclusao:
        null,

      contratoId:
        contratoAlpha.id,

      servicoId:
        sustentacaoInfra.id,

      responsavelId:
        carlos.id,

      criadoPorId:
        gestor.id
    });

  const osBloqueada =
    await upsertWorkOrder({
      codigo:
        `OS-${year}-000012`,

      titulo:
        "Corrigir falha de integração em aplicação corporativa",

      descricao:
        "Investigar falha de integração entre aplicação corporativa e serviço externo.",

      prioridade:
        "MEDIA",

      status:
        "BLOQUEADA",

      dataAbertura:
        utcDateTime(
          -6,
          11
        ),

      prazo:
        utcDay(4),

      dataConclusao:
        null,

      contratoId:
        contratoNexus.id,

      servicoId:
        aplicacoes.id,

      responsavelId:
        mariana.id,

      criadoPorId:
        gestor.id
    });

  const osAtrasada =
    await upsertWorkOrder({
      codigo:
        `OS-${year}-000013`,

      titulo:
        "Investigar alerta crítico de segurança",

      descricao:
        "Analisar alerta crítico identificado pelos mecanismos de monitoração e registrar evidências técnicas.",

      prioridade:
        "CRITICA",

      status:
        "ABERTA",

      dataAbertura:
        utcDateTime(
          -5,
          8,
          30
        ),

      prazo:
        utcDay(-2),

      dataConclusao:
        null,

      contratoId:
        contratoNexus.id,

      servicoId:
        seguranca.id,

      responsavelId:
        carlos.id,

      criadoPorId:
        gestor.id
    });

  const osMariana =
    await upsertWorkOrder({
      codigo:
        `OS-${year}-000014`,

      titulo:
        "Validar atualização de aplicação corporativa",

      descricao:
        "Executar validação operacional após atualização programada da aplicação corporativa.",

      prioridade:
        "BAIXA",

      status:
        "ABERTA",

      dataAbertura:
        utcDateTime(
          -1,
          14
        ),

      prazo:
        utcDay(7),

      dataConclusao:
        null,

      contratoId:
        contratoNexus.id,

      servicoId:
        aplicacoes.id,

      responsavelId:
        mariana.id,

      criadoPorId:
        gestor.id
    });

  /*
   * HISTÓRICO
   *
   * Apagamos SOMENTE os históricos
   * das cinco OS pertencentes ao
   * cenário demonstrativo.
   *
   * Nenhum outro histórico do banco
   * é alterado.
   */

  const seededOrderIds = [
    osConcluida.id,
    osAndamento.id,
    osBloqueada.id,
    osAtrasada.id,
    osMariana.id
  ];

  await prisma.historicoStatus.deleteMany({
    where: {
      ordemServicoId: {
        in:
          seededOrderIds
      }
    }
  });

  /*
   * OS 000010
   * ciclo completo
   */

  await createHistory(
    osConcluida.id,
    gestor.id,
    null,
    "ABERTA",
    "Ordem de serviço criada.",
    utcDateTime(
      -12,
      9
    )
  );

  await createHistory(
    osConcluida.id,
    carlos.id,
    "ABERTA",
    "EM_ANDAMENTO",
    "Atendimento técnico iniciado após análise preliminar.",
    utcDateTime(
      -11,
      8,
      30
    )
  );

  await createHistory(
    osConcluida.id,
    carlos.id,
    "EM_ANDAMENTO",
    "BLOQUEADA",
    "Atendimento bloqueado aguardando retorno do fornecedor.",
    utcDateTime(
      -10,
      14
    )
  );

  await createHistory(
    osConcluida.id,
    carlos.id,
    "BLOQUEADA",
    "EM_ANDAMENTO",
    "Retorno recebido e atendimento retomado.",
    utcDateTime(
      -9,
      9
    )
  );

  await createHistory(
    osConcluida.id,
    carlos.id,
    "EM_ANDAMENTO",
    "CONCLUIDA",
    "Falha identificada, correção aplicada e ambiente normalizado.",
    utcDateTime(
      -8,
      15,
      30
    )
  );

  /*
   * OS 000011
   */

  await createHistory(
    osAndamento.id,
    gestor.id,
    null,
    "ABERTA",
    "Ordem de serviço criada.",
    utcDateTime(
      -4,
      10
    )
  );

  await createHistory(
    osAndamento.id,
    carlos.id,
    "ABERTA",
    "EM_ANDAMENTO",
    "Coleta de métricas e diagnóstico técnico iniciados.",
    utcDateTime(
      -3,
      9
    )
  );

  /*
   * OS 000012
   */

  await createHistory(
    osBloqueada.id,
    gestor.id,
    null,
    "ABERTA",
    "Ordem de serviço criada.",
    utcDateTime(
      -6,
      11
    )
  );

  await createHistory(
    osBloqueada.id,
    mariana.id,
    "ABERTA",
    "EM_ANDAMENTO",
    "Análise da integração iniciada.",
    utcDateTime(
      -5,
      10
    )
  );

  await createHistory(
    osBloqueada.id,
    mariana.id,
    "EM_ANDAMENTO",
    "BLOQUEADA",
    "Aguardando liberação de acesso ao serviço externo.",
    utcDateTime(
      -4,
      16
    )
  );

  /*
   * OS 000013
   */

  await createHistory(
    osAtrasada.id,
    gestor.id,
    null,
    "ABERTA",
    "Ordem crítica aberta após alerta de segurança.",
    utcDateTime(
      -5,
      8,
      30
    )
  );

  /*
   * OS 000014
   */

  await createHistory(
    osMariana.id,
    gestor.id,
    null,
    "ABERTA",
    "Ordem criada para validação pós-atualização.",
    utcDateTime(
      -1,
      14
    )
  );

  console.log(
    "✅ Perfis e usuários preparados."
  );

  console.log(
    "✅ Clientes e contratos preparados."
  );

  console.log(
    "✅ Serviços tecnológicos preparados."
  );

  console.log(
    "✅ Ordens e históricos demonstrativos preparados."
  );

  console.log(
    "🌱 Seed PetroSys concluído com sucesso."
  );
}

main()
  .catch((error) => {
    console.error(
      "❌ Erro ao executar seed do PetroSys:"
    );

    console.error(
      error
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });