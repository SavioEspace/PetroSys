import { z } from "zod";

function somenteDigitos(value: string): string {
  return value.replace(/\D/g, "");
}

function isValidCnpj(cnpj: string): boolean {
  if (!/^\d{14}$/.test(cnpj)) {
    return false;
  }

  if (/^(\d)\1{13}$/.test(cnpj)) {
    return false;
  }

  const calcularDigito = (
    base: string,
    pesos: number[]
  ): number => {
    const soma = base
      .split("")
      .reduce(
        (total, numero, index) =>
          total +
          Number(numero) * pesos[index],
        0
      );

    const resto = soma % 11;

    return resto < 2
      ? 0
      : 11 - resto;
  };

  const primeiroDigito =
    calcularDigito(
      cnpj.slice(0, 12),
      [
        5, 4, 3, 2, 9, 8,
        7, 6, 5, 4, 3, 2
      ]
    );

  if (
    primeiroDigito !==
    Number(cnpj[12])
  ) {
    return false;
  }

  const segundoDigito =
    calcularDigito(
      cnpj.slice(0, 13),
      [
        6, 5, 4, 3, 2, 9, 8,
        7, 6, 5, 4, 3, 2
      ]
    );

  return (
    segundoDigito ===
    Number(cnpj[13])
  );
}

const optionalTextSchema = (
  maxLength: number
) =>
  z
    .string()
    .trim()
    .max(
      maxLength,
      `O campo deve possuir no máximo ${maxLength} caracteres.`
    )
    .optional()
    .transform((value) =>
      value === ""
        ? undefined
        : value
    );

const nullableTextSchema = (
  maxLength: number
) =>
  z
    .union([
      z
        .string()
        .trim()
        .max(
          maxLength,
          `O campo deve possuir no máximo ${maxLength} caracteres.`
        ),
      z.null()
    ])
    .optional()
    .transform((value) =>
      value === ""
        ? null
        : value
    );

export const createClientSchema =
  z.object({
    razaoSocial: z
      .string()
      .trim()
      .min(
        3,
        "A razão social deve possuir pelo menos 3 caracteres."
      )
      .max(
        200,
        "A razão social deve possuir no máximo 200 caracteres."
      ),

    nomeFantasia:
      optionalTextSchema(200),

    cnpj: z
      .string()
      .trim()
      .transform(somenteDigitos)
      .refine(
        (value) =>
          value.length === 14,
        "O CNPJ deve possuir 14 dígitos."
      )
      .refine(
        isValidCnpj,
        "Informe um CNPJ válido."
      ),

    email: z
      .string()
      .trim()
      .transform((value) =>
        value === ""
          ? undefined
          : value.toLowerCase()
      )
      .pipe(
        z
          .string()
          .email(
            "Informe um e-mail válido."
          )
          .optional()
      ),

    telefone: z
      .string()
      .trim()
      .transform((value) => {
        if (value === "") {
          return undefined;
        }

        return somenteDigitos(value);
      })
      .pipe(
        z
          .string()
          .min(
            10,
            "O telefone deve possuir pelo menos 10 dígitos."
          )
          .max(
            15,
            "O telefone deve possuir no máximo 15 dígitos."
          )
          .optional()
      )
  });

export const updateClientSchema =
  z
    .object({
      razaoSocial: z
        .string()
        .trim()
        .min(
          3,
          "A razão social deve possuir pelo menos 3 caracteres."
        )
        .max(
          200,
          "A razão social deve possuir no máximo 200 caracteres."
        )
        .optional(),

      nomeFantasia:
        nullableTextSchema(200),

      cnpj: z
        .string()
        .trim()
        .transform(somenteDigitos)
        .refine(
          (value) =>
            value.length === 14,
          "O CNPJ deve possuir 14 dígitos."
        )
        .refine(
          isValidCnpj,
          "Informe um CNPJ válido."
        )
        .optional(),

      email: z
        .union([
          z
            .string()
            .trim()
            .email(
              "Informe um e-mail válido."
            )
            .transform((value) =>
              value.toLowerCase()
            ),
          z.literal(""),
          z.null()
        ])
        .optional()
        .transform((value) =>
          value === ""
            ? null
            : value
        ),

      telefone: z
        .union([
          z
            .string()
            .trim()
            .transform(somenteDigitos)
            .refine(
              (value) =>
                value.length >= 10 &&
                value.length <= 15,
              "O telefone deve possuir entre 10 e 15 dígitos."
            ),
          z.literal(""),
          z.null()
        ])
        .optional()
        .transform((value) =>
          value === ""
            ? null
            : value
        )
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

export const clientIdParamSchema =
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

export const updateClientStatusSchema =
  z.object({
    ativo: z.boolean()
  });

export type CreateClientInput =
  z.infer<typeof createClientSchema>;

export type UpdateClientInput =
  z.infer<typeof updateClientSchema>;