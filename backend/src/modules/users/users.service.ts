import bcrypt from "bcryptjs";

import { prisma } from "../../config/prisma.js";

import type {
  CreateUserInput,
  UpdateUserInput
} from "./users.schema.js";

const publicUserSelect = {
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
} as const;

export async function listUsers() {
  return prisma.usuario.findMany({
    orderBy: {
      nome: "asc"
    },

    select: publicUserSelect
  });
}

export async function getUserById(
  id: number
) {
  return prisma.usuario.findUnique({
    where: {
      id
    },

    select: publicUserSelect
  });
}

export async function createUser(
  input: CreateUserInput
) {
  const usuarioExistente =
    await prisma.usuario.findUnique({
      where: {
        email: input.email
      }
    });

  if (usuarioExistente) {
    return {
      success: false as const,
      reason: "EMAIL_ALREADY_EXISTS" as const
    };
  }

  const perfil =
    await prisma.perfil.findUnique({
      where: {
        nome: input.perfil
      }
    });

  if (!perfil) {
    return {
      success: false as const,
      reason: "PROFILE_NOT_FOUND" as const
    };
  }

  const senhaHash = await bcrypt.hash(
    input.senha,
    12
  );

  const usuario =
    await prisma.usuario.create({
      data: {
        nome: input.nome,
        email: input.email,
        senhaHash,
        ativo: true,
        perfilId: perfil.id
      },

      select: publicUserSelect
    });

  return {
    success: true as const,
    usuario
  };
}

export async function updateUser(
  id: number,
  input: UpdateUserInput
) {
  const usuarioAtual =
    await prisma.usuario.findUnique({
      where: {
        id
      }
    });

  if (!usuarioAtual) {
    return {
      success: false as const,
      reason: "USER_NOT_FOUND" as const
    };
  }

  if (
    input.email &&
    input.email !== usuarioAtual.email
  ) {
    const emailEmUso =
      await prisma.usuario.findUnique({
        where: {
          email: input.email
        }
      });

    if (emailEmUso) {
      return {
        success: false as const,
        reason: "EMAIL_ALREADY_EXISTS" as const
      };
    }
  }

  let perfilId: number | undefined;

  if (input.perfil) {
    const perfil =
      await prisma.perfil.findUnique({
        where: {
          nome: input.perfil
        }
      });

    if (!perfil) {
      return {
        success: false as const,
        reason: "PROFILE_NOT_FOUND" as const
      };
    }

    perfilId = perfil.id;
  }

  let senhaHash: string | undefined;

  if (input.senha) {
    senhaHash = await bcrypt.hash(
      input.senha,
      12
    );
  }

  const usuario =
    await prisma.usuario.update({
      where: {
        id
      },

      data: {
        ...(input.nome !== undefined && {
          nome: input.nome
        }),

        ...(input.email !== undefined && {
          email: input.email
        }),

        ...(perfilId !== undefined && {
          perfilId
        }),

        ...(senhaHash !== undefined && {
          senhaHash
        })
      },

      select: publicUserSelect
    });

  return {
    success: true as const,
    usuario
  };
}

export async function updateUserStatus(
  id: number,
  ativo: boolean
) {
  const usuarioAtual =
    await prisma.usuario.findUnique({
      where: {
        id
      }
    });

  if (!usuarioAtual) {
    return {
      success: false as const,
      reason: "USER_NOT_FOUND" as const
    };
  }

  const usuario =
    await prisma.usuario.update({
      where: {
        id
      },

      data: {
        ativo
      },

      select: publicUserSelect
    });

  return {
    success: true as const,
    usuario
  };
}