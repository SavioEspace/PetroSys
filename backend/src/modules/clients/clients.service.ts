import { prisma } from "../../config/prisma.js";

import type {
  CreateClientInput,
  UpdateClientInput
} from "./clients.schema.js";

const publicClientSelect = {
  id: true,
  razaoSocial: true,
  nomeFantasia: true,
  cnpj: true,
  email: true,
  telefone: true,
  ativo: true,
  createdAt: true,
  updatedAt: true
} as const;

export async function listClients() {
  return prisma.cliente.findMany({
    orderBy: {
      razaoSocial: "asc"
    },

    select: publicClientSelect
  });
}

export async function getClientById(
  id: number
) {
  return prisma.cliente.findUnique({
    where: {
      id
    },

    select: publicClientSelect
  });
}

export async function createClient(
  input: CreateClientInput
) {
  const clienteExistente =
    await prisma.cliente.findUnique({
      where: {
        cnpj: input.cnpj
      }
    });

  if (clienteExistente) {
    return {
      success: false as const,
      reason:
        "CNPJ_ALREADY_EXISTS" as const
    };
  }

  const cliente =
    await prisma.cliente.create({
      data: {
        razaoSocial:
          input.razaoSocial,

        nomeFantasia:
          input.nomeFantasia,

        cnpj:
          input.cnpj,

        email:
          input.email,

        telefone:
          input.telefone,

        ativo: true
      },

      select: publicClientSelect
    });

  return {
    success: true as const,
    cliente
  };
}

export async function updateClient(
  id: number,
  input: UpdateClientInput
) {
  const clienteAtual =
    await prisma.cliente.findUnique({
      where: {
        id
      }
    });

  if (!clienteAtual) {
    return {
      success: false as const,
      reason:
        "CLIENT_NOT_FOUND" as const
    };
  }

  if (
    input.cnpj &&
    input.cnpj !== clienteAtual.cnpj
  ) {
    const cnpjEmUso =
      await prisma.cliente.findUnique({
        where: {
          cnpj: input.cnpj
        }
      });

    if (cnpjEmUso) {
      return {
        success: false as const,
        reason:
          "CNPJ_ALREADY_EXISTS" as const
      };
    }
  }

  const cliente =
    await prisma.cliente.update({
      where: {
        id
      },

      data: {
        ...(input.razaoSocial !==
          undefined && {
          razaoSocial:
            input.razaoSocial
        }),

        ...(input.nomeFantasia !==
          undefined && {
          nomeFantasia:
            input.nomeFantasia
        }),

        ...(input.cnpj !==
          undefined && {
          cnpj:
            input.cnpj
        }),

        ...(input.email !==
          undefined && {
          email:
            input.email
        }),

        ...(input.telefone !==
          undefined && {
          telefone:
            input.telefone
        })
      },

      select: publicClientSelect
    });

  return {
    success: true as const,
    cliente
  };
}

export async function updateClientStatus(
  id: number,
  ativo: boolean
) {
  const clienteAtual =
    await prisma.cliente.findUnique({
      where: {
        id
      }
    });

  if (!clienteAtual) {
    return {
      success: false as const,
      reason:
        "CLIENT_NOT_FOUND" as const
    };
  }

  const cliente =
    await prisma.cliente.update({
      where: {
        id
      },

      data: {
        ativo
      },

      select: publicClientSelect
    });

  return {
    success: true as const,
    cliente
  };
}