import type {
  ErrorRequestHandler,
  RequestHandler
} from "express";

interface HttpError
  extends Error {
  status?: number;
  statusCode?: number;
  type?: string;
}

export const notFoundHandler:
  RequestHandler = (
    request,
    response
  ) => {
    response.status(404).json({
      error: "ROUTE_NOT_FOUND",

      message:
        "A rota solicitada não foi encontrada.",

      path:
        request.originalUrl
    });
  };

export const errorHandler:
  ErrorRequestHandler = (
    error: HttpError,
    _request,
    response,
    _next
  ) => {
    const status =
      error.status ??
      error.statusCode;

    if (
      status === 413 ||
      error.type ===
        "entity.too.large"
    ) {
      response.status(413).json({
        error:
          "PAYLOAD_TOO_LARGE",

        message:
          "O corpo da requisição excede o tamanho permitido."
      });

      return;
    }

    if (
      status === 400 &&
      error instanceof SyntaxError
    ) {
      response.status(400).json({
        error:
          "INVALID_JSON",

        message:
          "O corpo JSON da requisição é inválido."
      });

      return;
    }

    console.error(
      "[PetroSys] Erro não tratado:",
      error
    );

    response.status(500).json({
      error:
        "INTERNAL_SERVER_ERROR",

      message:
        "Ocorreu um erro interno ao processar a solicitação."
    });
  };