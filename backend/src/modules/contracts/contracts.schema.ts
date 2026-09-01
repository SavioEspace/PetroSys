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

export const statusContratoSchema = z.enum([
  "ATIVO",
  "SUSPENSO",
  "ENCERRADO"
]);

export const createContractSchema = z
  .object({
    numero: z
      .string()
      .trim()
      .min(
        1,
        "O número do contrato é obrigatório."
      )
      .max(
        50,
        "O número do contrato deve possuir no máximo 50 caracteres."
      ),

    objeto: z
      .string()
      .trim()
      .min(
        5,
        "O objeto deve possuir pelo menos 5 caracteres."
      ),

    dataInicio: dateSchema,

    dataFim: dateSchema,

    status:
      statusContratoSchema.default("ATIVO"),

    observacoes: z
      .string()
      .trim()
      .optional()
      .transform((value) =>
        value === ""
          ? undefined
          : value
      ),

    clienteId: z.coerce
      .number()
      .int(
        "O ID do cliente deve ser um número inteiro."
      )
      .positive(
        "O ID do cliente deve ser positivo."
      )
  })
  .refine(
    (data) =>
      data.dataFim >= data.dataInicio,
    {
      message:
        "A data final não pode ser anterior à data inicial.",
      path: ["dataFim"]
    }
  );

export const updateContractSchema =
  z
    .object({
      numero: z
        .string()
        .trim()
        .min(
          1,
          "O número do contrato é obrigatório."
        )
        .max(
          50,
          "O número do contrato deve possuir no máximo 50 caracteres."
        )
        .optional(),

      objeto: z
        .string()
        .trim()
        .min(
          5,
          "O objeto deve possuir pelo menos 5 caracteres."
        )
        .optional(),

      dataInicio:
        dateSchema.optional(),

      dataFim:
        dateSchema.optional(),

      observacoes: z
        .union([
          z.string().trim(),
          z.null()
        ])
        .optional()
        .transform((value) =>
          value === ""
            ? null
            : value
        ),

      clienteId: z.coerce
        .number()
        .int(
          "O ID do cliente deve ser um número inteiro."
        )
        .positive(
          "O ID do cliente deve ser positivo."
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

export const contractIdParamSchema =
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

export const updateContractStatusSchema =
  z.object({
    status: statusContratoSchema
  });

export type CreateContractInput =
  z.infer<typeof createContractSchema>;

export type UpdateContractInput =
  z.infer<typeof updateContractSchema>;