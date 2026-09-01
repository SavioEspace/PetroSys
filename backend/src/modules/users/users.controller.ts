import type {
  Request,
  Response
} from "express";

import type {
  AuthenticatedRequest
} from "../auth/auth.middleware.js";

import {
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  userIdParamSchema
} from "./users.schema.js";

import {
  createUser,
  getUserById,
  listUsers,
  updateUser,
  updateUserStatus
} from "./users.service.js";

export async function listUsersController(
  _request: Request,
  response: Response
): Promise<void> {
  const usuarios = await listUsers();

  response.status(200).json({
    usuarios
  });
}

export async function getUserByIdController(
  request: Request,
  response: Response
): Promise<void> {
  const parsedParams =
    userIdParamSchema.safeParse(
      request.params
    );

  if (!parsedParams.success) {
    response.status(400).json({
      error: "INVALID_USER_ID",
      message: "ID de usuário inválido."
    });

    return;
  }

  const usuario = await getUserById(
    parsedParams.data.id
  );

  if (!usuario) {
    response.status(404).json({
      error: "USER_NOT_FOUND",
      message: "Usuário não encontrado."
    });

    return;
  }

  response.status(200).json({
    usuario
  });
}

export async function createUserController(
  request: Request,
  response: Response
): Promise<void> {
  const parsedBody =
    createUserSchema.safeParse(
      request.body
    );

  if (!parsedBody.success) {
    response.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Dados do usuário inválidos.",
      details:
        parsedBody.error.flatten().fieldErrors
    });

    return;
  }

  const result = await createUser(
    parsedBody.data
  );

  if (!result.success) {
    if (
      result.reason ===
      "EMAIL_ALREADY_EXISTS"
    ) {
      response.status(409).json({
        error: "EMAIL_ALREADY_EXISTS",
        message:
          "Já existe um usuário cadastrado com este e-mail."
      });

      return;
    }

    response.status(422).json({
      error: "PROFILE_NOT_FOUND",
      message:
        "O perfil informado não foi encontrado."
    });

    return;
  }

  response.status(201).json({
    message:
      "Usuário criado com sucesso.",
    usuario: result.usuario
  });
}

export async function updateUserController(
  request: Request,
  response: Response
): Promise<void> {
  const parsedParams =
    userIdParamSchema.safeParse(
      request.params
    );

  if (!parsedParams.success) {
    response.status(400).json({
      error: "INVALID_USER_ID",
      message: "ID de usuário inválido."
    });

    return;
  }

  const parsedBody =
    updateUserSchema.safeParse(
      request.body
    );

  if (!parsedBody.success) {
    response.status(400).json({
      error: "VALIDATION_ERROR",
      message:
        "Dados de atualização inválidos.",
      details:
        parsedBody.error.flatten()
          .fieldErrors
    });

    return;
  }

  const result = await updateUser(
    parsedParams.data.id,
    parsedBody.data
  );

  if (!result.success) {
    switch (result.reason) {
      case "USER_NOT_FOUND":
        response.status(404).json({
          error: "USER_NOT_FOUND",
          message:
            "Usuário não encontrado."
        });

        return;

      case "EMAIL_ALREADY_EXISTS":
        response.status(409).json({
          error: "EMAIL_ALREADY_EXISTS",
          message:
            "Já existe um usuário cadastrado com este e-mail."
        });

        return;

      case "PROFILE_NOT_FOUND":
        response.status(422).json({
          error: "PROFILE_NOT_FOUND",
          message:
            "O perfil informado não foi encontrado."
        });

        return;
    }
  }

  response.status(200).json({
    message:
      "Usuário atualizado com sucesso.",
    usuario: result.usuario
  });
}

export async function updateUserStatusController(
  request: AuthenticatedRequest,
  response: Response
): Promise<void> {
  const parsedParams =
    userIdParamSchema.safeParse(
      request.params
    );

  if (!parsedParams.success) {
    response.status(400).json({
      error: "INVALID_USER_ID",
      message: "ID de usuário inválido."
    });

    return;
  }

  const parsedBody =
    updateUserStatusSchema.safeParse(
      request.body
    );

  if (!parsedBody.success) {
    response.status(400).json({
      error: "VALIDATION_ERROR",
      message:
        "Status do usuário inválido.",
      details:
        parsedBody.error.flatten()
          .fieldErrors
    });

    return;
  }

  const authenticatedUserId =
    request.auth?.userId;

  const targetUserId =
    parsedParams.data.id;

  if (
    authenticatedUserId === targetUserId &&
    parsedBody.data.ativo === false
  ) {
    response.status(409).json({
      error:
        "SELF_DEACTIVATION_NOT_ALLOWED",
      message:
        "Você não pode desativar a própria conta."
    });

    return;
  }

  const result =
    await updateUserStatus(
      targetUserId,
      parsedBody.data.ativo
    );

  if (!result.success) {
    response.status(404).json({
      error: "USER_NOT_FOUND",
      message: "Usuário não encontrado."
    });

    return;
  }

  response.status(200).json({
    message: parsedBody.data.ativo
      ? "Usuário ativado com sucesso."
      : "Usuário desativado com sucesso.",

    usuario: result.usuario
  });
}