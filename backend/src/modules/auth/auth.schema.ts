import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .transform((value) => value.toLowerCase()),

  senha: z
    .string()
    .min(1, "A senha é obrigatória.")
});