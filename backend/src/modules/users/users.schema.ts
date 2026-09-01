import { z } from "zod";

export const perfilSchema = z.enum([
  "GESTOR",
  "ANALISTA",
  "TECNICO"
]);

export const createUserSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, "O nome deve possuir pelo menos 3 caracteres.")
    .max(150, "O nome deve possuir no máximo 150 caracteres."),

  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .transform((value) => value.toLowerCase()),

  senha: z
    .string()
    .min(8, "A senha deve possuir pelo menos 8 caracteres.")
    .max(72, "A senha deve possuir no máximo 72 caracteres."),

  perfil: perfilSchema
});

export const updateUserSchema = z
  .object({
    nome: z
      .string()
      .trim()
      .min(3, "O nome deve possuir pelo menos 3 caracteres.")
      .max(150, "O nome deve possuir no máximo 150 caracteres.")
      .optional(),

    email: z
      .string()
      .trim()
      .email("Informe um e-mail válido.")
      .transform((value) => value.toLowerCase())
      .optional(),

    senha: z
      .string()
      .min(8, "A senha deve possuir pelo menos 8 caracteres.")
      .max(72, "A senha deve possuir no máximo 72 caracteres.")
      .optional(),

    perfil: perfilSchema.optional()
  })
  .refine(
    (data) =>
      data.nome !== undefined ||
      data.email !== undefined ||
      data.senha !== undefined ||
      data.perfil !== undefined,
    {
      message:
        "Informe pelo menos um campo para atualização."
    }
  );

export const userIdParamSchema = z.object({
  id: z.coerce
    .number()
    .int("O ID deve ser um número inteiro.")
    .positive("O ID deve ser positivo.")
});

export type CreateUserInput =
  z.infer<typeof createUserSchema>;

export type UpdateUserInput =
  z.infer<typeof updateUserSchema>;

  export const updateUserStatusSchema = z.object({
  ativo: z.boolean()
});