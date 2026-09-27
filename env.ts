import { createEnv } from "@t3-oss/env-nuxt";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    /** DeepSeek API key for the coding agent — see `.env.example`. */
    DEEPSEEK_API_KEY: z.string().optional(),
    /** Override for OpenAI-compatible gateways and local test servers. */
    DEEPSEEK_BASE_URL: z.url().optional(),
  },
});
