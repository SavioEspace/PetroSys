import { z } from "zod";

const dateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "A data deve estar no formato YYYY-MM-DD."
  )
  .refine(
    (value) => {
      const date = new Date(
        `${value}T00:00:00.000Z`
      );

      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    },
    "Informe uma data válida."
  );

export const prioridadeOrdemServicoSchema =
  z.enum([
    "BAIXA",
    "MEDIA",
    "ALTA",
    "CRITICA"
  ]);

export const statusOrdemServicoSchema =
  z.enum([
    "ABERTA",
    "EM_ANDAMENTO",
    "BLOQUEADA",
    "CONCLUIDA",
    "CANCELADA"
  ]);

export const createWorkOrderSchema =
  z.object({
    titulo: z
      .string()
      .trim()
      .min(
        3,
        "O título deve possuir pelo menos 3 caracteres."
      )
      .max(
        200,
        "O título deve possuir no máximo 200 caracteres."
      ),

    descricao: z
      .string()
      .trim()
      .min(
        5,
        "A descrição deve possuir pelo menos 5 caracteres."
      ),

    prioridade:
      prioridadeOrdemServicoSchema.default(
        "MEDIA"
      ),

    prazo: dateSchema,

    contratoId: z.coerce
      .number()
      .int(
        "O ID do contrato deve ser um número inteiro."
      )
      .positive(
        "O ID do contrato deve ser positivo."
      ),

    servicoId: z.coerce
      .number()
      .int(
        "O ID do serviço deve ser um número inteiro."
      )
      .positive(
        "O ID do serviço deve ser positivo."
      ),

    responsavelId: z.coerce
      .number()
      .int(
        "O ID do responsável deve ser um número inteiro."
      )
      .positive(
        "O ID do responsável deve ser positivo."
      )
  });

export const updateWorkOrderSchema =
  z
    .object({
      titulo: z
        .string()
        .trim()
        .min(
          3,
          "O título deve possuir pelo menos 3 caracteres."
        )
        .max(
          200,
          "O título deve possuir no máximo 200 caracteres."
        )
        .optional(),

      descricao: z
        .string()
        .trim()
        .min(
          5,
          "A descrição deve possuir pelo menos 5 caracteres."
        )
        .optional(),

      prioridade:
        prioridadeOrdemServicoSchema.optional(),

      prazo:
        dateSchema.optional(),

      responsavelId: z.coerce
        .number()
        .int(
          "O ID do responsável deve ser um número inteiro."
        )
        .positive(
          "O ID do responsável deve ser positivo."
        )
        .optional()
    })
    .refine(
      (data) =>
        Object.values(data).some(
          (value) =>
            value !== undefined
        ),
      {
        message:
          "Informe pelo menos um campo para atualização."
      }
    );

export const workOrderIdParamSchema =
  z.object({
    id: z.coerce
      .number()
      .int(
        "O ID deve ser um número inteiro."
      )
      .positive(
        "O ID deve ser positivo."
      )
  });

export const updateWorkOrderStatusSchema =
  z.object({
    status:
      statusOrdemServicoSchema,

    observacao: z
      .string()
      .trim()
      .max(
        1000,
        "A observação deve possuir no máximo 1000 caracteres."
      )
      .optional()
      .transform((value) =>
        value === ""
          ? undefined
          : value
      )
  });

export type CreateWorkOrderInput =
  z.infer<typeof createWorkOrderSchema>;

export type UpdateWorkOrderInput =
  z.infer<typeof updateWorkOrderSchema>;