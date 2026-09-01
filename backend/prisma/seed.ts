import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não definida.");
}

const adapter = new PrismaPg({
  connectionString
});

const prisma = new PrismaClient({
  adapter
});

interface SeedUser {
  nome: string;
  email: string;
  senha: string;
  perfil: string;
}

async function upsertSeedUser(user: SeedUser) {
  const perfil = await prisma.perfil.findUnique({
    where: {
      nome: user.perfil
    }
  });

  if (!perfil) {
    throw new Error(
      `Perfil ${user.perfil} não encontrado.`
    );
  }

  const senhaHash = await bcrypt.hash(
    user.senha,
    12
  );

  await prisma.usuario.upsert({
    where: {
      email: user.email
    },

    update: {
      nome: user.nome,
      senhaHash,
      ativo: true,
      perfilId: perfil.id
    },

    create: {
      nome: user.nome,
      email: user.email,
      senhaHash,
      ativo: true,
      perfilId: perfil.id
    }
  });
}

async function main() {
  const perfis = [
    {
      nome: "GESTOR",
      descricao:
        "Gestor operacional com acesso gerencial ao sistema."
    },
    {
      nome: "ANALISTA",
      descricao:
        "Analista administrativo responsável pela gestão operacional dos registros."
    },
    {
      nome: "TECNICO",
      descricao:
        "Usuário técnico responsável pela execução e atualização das ordens de serviço."
    }
  ];

  for (const perfil of perfis) {
    await prisma.perfil.upsert({
      where: {
        nome: perfil.nome
      },

      update: {
        descricao: perfil.descricao
      },

      create: perfil
    });
  }

  const seedUsers: SeedUser[] = [
    {
      nome:
        process.env.SEED_ADMIN_NAME ??
        "Administrador PetroSys",

      email:
        process.env.SEED_ADMIN_EMAIL ??
        "gestor@petrosys.local",

      senha:
        process.env.SEED_ADMIN_PASSWORD ??
        "change_me",

      perfil: "GESTOR"
    },

    {
      nome:
        process.env.SEED_ANALISTA_NAME ??
        "Analista Demo",

      email:
        process.env.SEED_ANALISTA_EMAIL ??
        "analista@petrosys.local",

      senha:
        process.env.SEED_ANALISTA_PASSWORD ??
        "change_me",

      perfil: "ANALISTA"
    },

    {
      nome:
        process.env.SEED_TECNICO_NAME ??
        "Técnico Demo",

      email:
        process.env.SEED_TECNICO_EMAIL ??
        "tecnico@petrosys.local",

      senha:
        process.env.SEED_TECNICO_PASSWORD ??
        "change_me",

      perfil: "TECNICO"
    }
  ];

  for (const user of seedUsers) {
    await upsertSeedUser(user);
  }

  console.log(
    "✅ Perfis do PetroSys criados/atualizados."
  );

  console.log(
    "✅ Usuários iniciais criados/atualizados."
  );
}

main()
  .catch((error) => {
    console.error(
      "❌ Erro ao executar seed:",
      error
    );

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });