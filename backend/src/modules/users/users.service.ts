import { prisma } from "../../config/prisma.js";

export async function listUsers() {
  return prisma.usuario.findMany({
    orderBy: {
      nome: "asc"
    },

    select: {
      id: true,
      nome: true,
      email: true,
      ativo: true,
      createdAt: true,
      updatedAt: true,

      perfil: {
        select: {
          id: true,
          nome: true
        }
      }
    }
  });
}