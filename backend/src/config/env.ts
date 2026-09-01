import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(3000),

  FRONTEND_URL: z
    .string()
    .url()
    .default("http://localhost:5173"),

  DATABASE_URL: z.string().min(1),

  JWT_SECRET: z.string().min(32),

  JWT_EXPIRES_IN: z.string().default("8h"),

  AUTH_COOKIE_NAME: z.string().default("petrosys_auth")
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Erro nas variáveis de ambiente:");
  console.error(parsedEnv.error.flatten().fieldErrors);

  process.exit(1);
}

export const env = parsedEnv.data;