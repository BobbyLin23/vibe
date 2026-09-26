import { defineConfig } from "drizzle-kit";
import { env } from "./env";

export default defineConfig({
  out: "./server/db/drizzle",
  schema: "./server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
