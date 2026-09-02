import type {
  CookieOptions,
  Request,
  Response
} from "express";

import {
  env
} from "../../config/env.js";

import {
  prisma
} from "../../config/prisma.js";

import {
  loginSchema
} from "./auth.schema.js";

import {
  authenticateUser
} from "./auth.service.js";

import type {
  AuthenticatedRequest
} from "./auth.middleware.js";

const authCookieOptions:
  CookieOptions = {
    httpOnly: true,

    secure:
      env.NODE_ENV ===
      "production",

    sameSite:
      "lax",

    path:
      "/api/v1",

    maxAge:
      8 * 60 * 60 * 1000
  };

export async function login(
  request: Request,
  response: Response
) {
  const parsedBody =
    loginSchema.safeParse(
      request.body
    );

  if (!parsedBody.success) {
    response.status(400).json({
      error:
        "VALIDATION_ERROR",

      message:
        "Dados de login inválidos.",

      details:
        parsedBody.error
          .flatten()
          .fieldErrors
    });

    return;
  }

  const result =
    await authenticateUser(
      parsedBody.data.email,
      parsedBody.data.senha
    );

  if (!result) {
    return response
      .status(401)
      .json({
        error:
          "INVALID_CREDENTIALS",

        message:
          "E-mail ou senha inválidos."
      });
  }

  response.cookie(
    env.AUTH_COOKIE_NAME,
    result.token,
    authCookieOptions
  );

  return response
    .status(200)
    .json({
      message:
        "Login realizado com sucesso.",

      usuario:
        result.usuario
    });
}

export async function me(
  request:
    AuthenticatedRequest,

  response:
    Response
) {
  if (!request.auth) {
    return response
      .status(401)
      .json({
        error:
          "UNAUTHORIZED",

        message:
          "Autenticação necessária."
      });
  }

  const usuario =
    await prisma.usuario
      .findUnique({
        where: {
          id:
            request.auth.userId
        },

        include: {
          perfil: true
        }
      });

  if (
    !usuario ||
    !usuario.ativo
  ) {
    return response
      .status(401)
      .json({
        error:
          "UNAUTHORIZED",

        message:
          "Usuário não autorizado."
      });
  }

  return response
    .status(200)
    .json({
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
    });
}

export async function logout(
  _request: Request,
  response: Response
) {
  response.clearCookie(
    env.AUTH_COOKIE_NAME,
    {
      httpOnly: true,

      secure:
        env.NODE_ENV ===
        "production",

      sameSite:
        "lax",

      path:
        "/api/v1"
    }
  );

  return response
    .status(200)
    .json({
      message:
        "Logout realizado com sucesso."
    });
}