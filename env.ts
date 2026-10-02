import { createEnv } from "@t3-oss/env-nuxt";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    /** DeepSeek API key for the coding agent — see `.env.example`. */
    DEEPSEEK_API_KEY: z.string().optional(),
    /** Override for OpenAI-compatible gateways and local test servers. */
    DEEPSEEK_BASE_URL: z.url().optional(),
    /** E2B API key for the sandbox the coding agent's tools run in — see `.env.example`. */
    E2B_API_KEY: z.string().optional(),
    /** E2B template the sandbox boots from; defaults to the SDK's own `base` template. */
    E2B_TEMPLATE: z.string().optional(),
  },
});
