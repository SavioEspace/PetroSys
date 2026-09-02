import { z } from "zod";

export const statusServicoSchema = z.enum([
  "ATIVO",
  "SUSPENSO",
  "ENCERRADO"
]);

export const createServiceSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(
      3,
      "O nome do serviço deve possuir pelo menos 3 caracteres."
    )
    .max(
      150,
      "O nome do serviço deve possuir no máximo 150 caracteres."
    ),

  descricao: z
    .string()
    .trim()
    .min(
      5,
      "A descrição deve possuir pelo menos 5 caracteres."
    ),

  categoria: z
    .string()
    .trim()
    .min(
      2,
      "A categoria deve possuir pelo menos 2 caracteres."
    )
    .max(
      100,
      "A categoria deve possuir no máximo 100 caracteres."
    ),

  status: statusServicoSchema.default("ATIVO"),

  contratoId: z.coerce
    .number()
    .int(
      "O ID do contrato deve ser um número inteiro."
    )
    .positive(
      "O ID do contrato deve ser positivo."
    )
});

export const updateServiceSchema = z
  .object({
    nome: z
      .string()
      .trim()
      .min(
        3,
        "O nome do serviço deve possuir pelo menos 3 caracteres."
      )
      .max(
        150,
        "O nome do serviço deve possuir no máximo 150 caracteres."
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

    categoria: z
      .string()
      .trim()
      .min(
        2,
        "A categoria deve possuir pelo menos 2 caracteres."
      )
      .max(
        100,
        "A categoria deve possuir no máximo 100 caracteres."
      )
      .optional(),

    contratoId: z.coerce
      .number()
      .int(
        "O ID do contrato deve ser um número inteiro."
      )
      .positive(
        "O ID do contrato deve ser positivo."
      )
      .optional()
  })
  .refine(
    (data) =>
      Object.values(data).some(
        (value) => value !== undefined
      ),
    {
      message:
        "Informe pelo menos um campo para atualização."
    }
  );

export const serviceIdParamSchema = z.object({
  id: z.coerce
    .number()
    .int(
      "O ID deve ser um número inteiro."
    )
    .positive(
      "O ID deve ser positivo."
    )
});

export const updateServiceStatusSchema = z.object({
  status: statusServicoSchema
});

export type CreateServiceInput =
  z.infer<typeof createServiceSchema>;

export type UpdateServiceInput =
  z.infer<typeof updateServiceSchema>;