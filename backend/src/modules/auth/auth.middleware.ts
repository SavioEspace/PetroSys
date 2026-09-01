import type {
  NextFunction,
  Request,
  Response
} from "express";

import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import { verifyAuthToken } from "./auth.service.js";
import type { AuthenticatedRequestData } from "./auth.types.js";

export interface AuthenticatedRequest extends Request {
  auth?: AuthenticatedRequestData;
}

/**
 * Verifica se o usuário está autenticado.
 *
 * Aceita o JWT por:
 * - cookie HttpOnly;
 * - Authorization: Bearer <token>.
 */
export async function requireAuth(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  const cookieToken =
    request.cookies?.[env.AUTH_COOKIE_NAME];

  const authorization =
    request.headers.authorization;

  const bearerToken =
    authorization?.startsWith("Bearer ")
      ? authorization.substring(7)
      : undefined;

  const token = cookieToken ?? bearerToken;

  if (!token) {
    response.status(401).json({
      error: "UNAUTHORIZED",
      message: "Autenticação necessária."
    });

    return;
  }

  const payload = verifyAuthToken(token);

  if (!payload) {
    response.status(401).json({
      error: "INVALID_TOKEN",
      message: "Sessão inválida ou expirada."
    });

    return;
  }

  const usuario = await prisma.usuario.findUnique({
    where: {
      id: payload.userId
    },

    include: {
      perfil: true
    }
  });

  if (!usuario || !usuario.ativo) {
    response.status(401).json({
      error: "UNAUTHORIZED",
      message: "Usuário não autorizado."
    });

    return;
  }

  request.auth = {
    userId: usuario.id,
    email: usuario.email,
    perfil: usuario.perfil.nome
  };

  next();
}

/**
 * Autoriza o acesso somente aos perfis informados.
 *
 * Deve ser utilizado depois do requireAuth.
 *
 * Exemplos:
 *
 * requireRoles("GESTOR")
 *
 * requireRoles("GESTOR", "ANALISTA")
 */
export function requireRoles(
  ...allowedRoles: string[]
) {
  return (
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction
  ): void => {
    if (!request.auth) {
      response.status(401).json({
        error: "UNAUTHORIZED",
        message: "Autenticação necessária."
      });

      return;
    }

    const perfilPermitido =
      allowedRoles.includes(request.auth.perfil);

    if (!perfilPermitido) {
      response.status(403).json({
        error: "FORBIDDEN",
        message:
          "Você não possui permissão para acessar este recurso."
      });

      return;
    }

    next();
  };
}