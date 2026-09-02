import bcrypt from "bcryptjs";

import {
  prisma
} from "../src/config/prisma.js";

function dateOnly(
  offsetDays: number
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

export function dateInput(
  offsetDays: number
): string {
  return dateOnly(
    offsetDays
  )
    .toISOString()
    .slice(0, 10);
}

export async function resetTestDatabase() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "historicos_status",
      "ordens_servico",
      "servicos_tecnologicos",
      "contratos",
      "clientes",
      "usuarios",
      "perfis"
    RESTART IDENTITY CASCADE;
  `);
}

export async function createBaseTestData() {
  const gestorProfile =
    await prisma.perfil.create({
      data: {
        nome: "GESTOR",
        descricao:
          "Gestor de testes"
      }
    });

  const analystProfile =
    await prisma.perfil.create({
      data: {
        nome: "ANALISTA",
        descricao:
          "Analista de testes"
      }
    });

  const technicianProfile =
    await prisma.perfil.create({
      data: {
        nome: "TECNICO",
        descricao:
          "Técnico de testes"
      }
    });

  const [
    gestorPassword,
    analystPassword,
    technicianPassword
  ] = await Promise.all([
    bcrypt.hash(
      "Gestor@Test2026",
      12
    ),

    bcrypt.hash(
      "Analista@Test2026",
      12
    ),

    bcrypt.hash(
      "Tecnico@Test2026",
      12
    )
  ]);

  const gestor =
    await prisma.usuario.create({
      data: {
        nome:
          "Gestor Teste",

        email:
          "gestor@test.petrosys",

        senhaHash:
          gestorPassword,

        ativo: true,

        perfilId:
          gestorProfile.id
      }
    });

  const analista =
    await prisma.usuario.create({
      data: {
        nome:
          "Analista Teste",

        email:
          "analista@test.petrosys",

        senhaHash:
          analystPassword,

        ativo: true,

        perfilId:
          analystProfile.id
      }
    });

  const tecnico =
    await prisma.usuario.create({
      data: {
        nome:
          "Técnico Teste",

        email:
          "tecnico@test.petrosys",

        senhaHash:
          technicianPassword,

        ativo: true,

        perfilId:
          technicianProfile.id
      }
    });

  return {
    profiles: {
      gestor:
        gestorProfile,

      analista:
        analystProfile,

      tecnico:
        technicianProfile
    },

    users: {
      gestor,
      analista,
      tecnico
    },

    credentials: {
      gestor: {
        email:
          "gestor@test.petrosys",

        senha:
          "Gestor@Test2026"
      },

      analista: {
        email:
          "analista@test.petrosys",

        senha:
          "Analista@Test2026"
      },

      tecnico: {
        email:
          "tecnico@test.petrosys",

        senha:
          "Tecnico@Test2026"
      }
    }
  };
}

export async function createBusinessTestData() {
  const base =
    await createBaseTestData();

  const secondTechnicianPassword =
    await bcrypt.hash(
      "OutroTecnico@Test2026",
      12
    );

  const tecnico2 =
    await prisma.usuario.create({
      data: {
        nome:
          "Outro Técnico Teste",

        email:
          "outro.tecnico@test.petrosys",

        senhaHash:
          secondTechnicianPassword,

        ativo: true,

        perfilId:
          base.profiles.tecnico.id
      }
    });

  const clienteAtivoA =
    await prisma.cliente.create({
      data: {
        razaoSocial:
          "Cliente Ativo Alpha Ltda",

        nomeFantasia:
          "Alpha Test",

        cnpj:
          "10000000000001",

        email:
          "alpha@test.petrosys",

        telefone:
          "21999990001",

        ativo: true
      }
    });

  const clienteAtivoB =
    await prisma.cliente.create({
      data: {
        razaoSocial:
          "Cliente Ativo Beta Ltda",

        nomeFantasia:
          "Beta Test",

        cnpj:
          "20000000000002",

        email:
          "beta@test.petrosys",

        telefone:
          "21999990002",

        ativo: true
      }
    });

  const clienteInativo =
    await prisma.cliente.create({
      data: {
        razaoSocial:
          "Cliente Inativo Teste Ltda",

        nomeFantasia:
          "Cliente Inativo",

        cnpj:
          "30000000000003",

        email:
          "inativo@test.petrosys",

        telefone:
          "21999990003",

        ativo: false
      }
    });

  const contratoA =
    await prisma.contrato.create({
      data: {
        numero:
          "TEST-CTR-A",

        objeto:
          "Contrato ativo A para testes de integração.",

        dataInicio:
          dateOnly(-30),

        dataFim:
          dateOnly(120),

        status:
          "ATIVO",

        clienteId:
          clienteAtivoA.id
      }
    });

  const contratoB =
    await prisma.contrato.create({
      data: {
        numero:
          "TEST-CTR-B",

        objeto:
          "Contrato ativo B para testes de integração.",

        dataInicio:
          dateOnly(-20),

        dataFim:
          dateOnly(150),

        status:
          "ATIVO",

        clienteId:
          clienteAtivoB.id
      }
    });

  const contratoSuspenso =
    await prisma.contrato.create({
      data: {
        numero:
          "TEST-CTR-SUSPENSO",

        objeto:
          "Contrato suspenso para testes.",

        dataInicio:
          dateOnly(-20),

        dataFim:
          dateOnly(100),

        status:
          "SUSPENSO",

        clienteId:
          clienteAtivoA.id
      }
    });

  const contratoClienteInativo =
    await prisma.contrato.create({
      data: {
        numero:
          "TEST-CTR-CLIENTE-INATIVO",

        objeto:
          "Contrato ligado a cliente inativo.",

        dataInicio:
          dateOnly(-20),

        dataFim:
          dateOnly(100),

        status:
          "ATIVO",

        clienteId:
          clienteInativo.id
      }
    });

  const servicoA =
    await prisma.servicoTecnologico.create({
      data: {
        nome:
          "Serviço Alpha",

        descricao:
          "Serviço ativo do contrato Alpha.",

        categoria:
          "Infraestrutura",

        status:
          "ATIVO",

        contratoId:
          contratoA.id
      }
    });

  const servicoB =
    await prisma.servicoTecnologico.create({
      data: {
        nome:
          "Serviço Beta",

        descricao:
          "Serviço ativo do contrato Beta.",

        categoria:
          "Aplicações",

        status:
          "ATIVO",

        contratoId:
          contratoB.id
      }
    });

  const ownOrder =
    await prisma.ordemServico.create({
      data: {
        codigo:
          "OS-TEST-OWN-001",

        titulo:
          "Ordem atribuída ao técnico autenticado",

        descricao:
          "Ordem utilizada para testar autorização do técnico.",

        prioridade:
          "MEDIA",

        status:
          "ABERTA",

        prazo:
          dateOnly(20),

        contratoId:
          contratoA.id,

        servicoId:
          servicoA.id,

        responsavelId:
          base.users.tecnico.id,

        criadoPorId:
          base.users.gestor.id
      }
    });

  await prisma.historicoStatus.create({
    data: {
      ordemServicoId:
        ownOrder.id,

      usuarioId:
        base.users.gestor.id,

      statusAnterior:
        null,

      statusNovo:
        "ABERTA",

      observacao:
        "Ordem de teste criada."
    }
  });

  const otherOrder =
    await prisma.ordemServico.create({
      data: {
        codigo:
          "OS-TEST-OTHER-001",

        titulo:
          "Ordem atribuída a outro técnico",

        descricao:
          "Ordem utilizada para validar isolamento operacional.",

        prioridade:
          "ALTA",

        status:
          "ABERTA",

        prazo:
          dateOnly(20),

        contratoId:
          contratoA.id,

        servicoId:
          servicoA.id,

        responsavelId:
          tecnico2.id,

        criadoPorId:
          base.users.gestor.id
      }
    });

  await prisma.historicoStatus.create({
    data: {
      ordemServicoId:
        otherOrder.id,

      usuarioId:
        base.users.gestor.id,

      statusAnterior:
        null,

      statusNovo:
        "ABERTA",

      observacao:
        "Ordem de outro técnico criada."
    }
  });

  return {
    ...base,

    users: {
      ...base.users,
      tecnico2
    },

    clientes: {
      ativoA:
        clienteAtivoA,

      ativoB:
        clienteAtivoB,

      inativo:
        clienteInativo
    },

    contratos: {
      ativoA:
        contratoA,

      ativoB:
        contratoB,

      suspenso:
        contratoSuspenso,

      clienteInativo:
        contratoClienteInativo
    },

    servicos: {
      ativoA:
        servicoA,

      ativoB:
        servicoB
    },

    ordens: {
      propriaTecnico:
        ownOrder,

      outroTecnico:
        otherOrder
    }
  };
}