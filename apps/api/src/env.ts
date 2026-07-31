import { logger } from "@repo/logger";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().optional(),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  NEXT_PUBLIC_API_URL: z.string().default("http://localhost:8000"),
  CLIENT_URL: z
    .string()
    .default("http://localhost:3000,https://todo-trpc-web.vercel.app")
    .describe("Comma-separated list of allowed frontend origins for CORS"),
});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);

  if (!safeParseResult.success) {
    logger.error(`Invalid environment variables: ${safeParseResult.error.flatten().fieldErrors}`);
    throw new Error("Invalid environment variables");
  }

  return safeParseResult.data;
}

export const env = createEnv(process.env);
