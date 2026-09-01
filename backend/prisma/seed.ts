import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

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

async function main() {
  const perfis = [
    {
      nome: "GESTOR",
      descricao: "Gestor operacional com acesso gerencial ao sistema."
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

  console.log("✅ Perfis do PetroSys criados com sucesso.");
}

main()
  .catch((error) => {
    console.error("❌ Erro ao executar seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });