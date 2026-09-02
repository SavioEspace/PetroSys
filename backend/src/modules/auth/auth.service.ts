import bcrypt from "bcryptjs";

import jwt, {
  type SignOptions
} from "jsonwebtoken";

import {
  env
} from "../../config/env.js";

import {
  prisma
} from "../../config/prisma.js";

import type {
  AuthTokenPayload
} from "./auth.types.js";

const JWT_ALGORITHM =
  "HS256" as const;

const JWT_ISSUER =
  "petrosys-api";

const JWT_AUDIENCE =
  "petrosys-web";

export async function authenticateUser(
  email: string,
  senha: string
) {
  const usuario =
    await prisma.usuario.findUnique({
      where: {
        email
      },

      include: {
        perfil: true
      }
    });

  if (
    !usuario ||
    !usuario.ativo
  ) {
    return null;
  }

  const senhaValida =
    await bcrypt.compare(
      senha,
      usuario.senhaHash
    );

  if (!senhaValida) {
    return null;
  }

  const payload:
    AuthTokenPayload = {
      userId:
        usuario.id,

      email:
        usuario.email,

      perfil:
        usuario.perfil.nome
    };

  const signOptions:
    SignOptions = {
      algorithm:
        JWT_ALGORITHM,

      expiresIn:
        env.JWT_EXPIRES_IN as
          SignOptions["expiresIn"],

      issuer:
        JWT_ISSUER,

      audience:
        JWT_AUDIENCE
    };

  const token =
    jwt.sign(
      payload,
      env.JWT_SECRET,
      signOptions
    );

  return {
    token,

    usuario: {
      id:
        usuario.id,

      nome:
        usuario.nome,

      email:
        usuario.email,

      ativo:
        usuario.ativo,

      perfil: {
        id:
          usuario.perfil.id,

        nome:
          usuario.perfil.nome
      }
    }
  };
}

export function verifyAuthToken(
  token: string
): AuthTokenPayload | null {
  try {
    const decoded =
      jwt.verify(
        token,
        env.JWT_SECRET,
        {
          algorithms: [
            JWT_ALGORITHM
          ],

          issuer:
            JWT_ISSUER,

          audience:
            JWT_AUDIENCE
        }
      );

    if (
      typeof decoded ===
        "string" ||
      typeof decoded.userId !==
        "number" ||
      typeof decoded.email !==
        "string" ||
      typeof decoded.perfil !==
        "string"
    ) {
      return null;
    }

    return {
      userId:
        decoded.userId,

      email:
        decoded.email,

      perfil:
        decoded.perfil
    };
  } catch {
    return null;
  }
}