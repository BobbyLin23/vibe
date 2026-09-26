import { ORPCError } from "@orpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "#server/db";
import { usersTable } from "#server/db/schema";
import { base } from "./base";

const userSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  age: z.number().int(),
  email: z.string(),
});

const createUserInput = z.object({
  name: z.string().trim().min(1).max(255),
  age: z.number().int().min(0).max(150),
  email: z.email().max(255),
});

export const list = base.output(z.array(userSchema)).handler(async () => {
  return db.select().from(usersTable).orderBy(desc(usersTable.id));
});

export const create = base
  .errors({
    CONFLICT: { message: "A user with this email already exists" },
  })
  .input(createUserInput)
  .output(userSchema)
  .handler(async ({ input, errors }) => {
    try {
      const [user] = await db
        .insert(usersTable)
        .values({ name: input.name, age: input.age, email: input.email })
        .returning();

      if (!user) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Insert returned no row",
        });
      }

      return user;
    } catch (error) {
      // Drizzle wraps driver failures in `DrizzleQueryError`; the Postgres SQLSTATE for a
      // unique violation (23505) lives on the cause, which is the NeonDbError.
      const cause = error instanceof Error ? error.cause : undefined;

      if (
        typeof cause === "object" &&
        cause !== null &&
        "code" in cause &&
        cause.code === "23505"
      ) {
        throw errors.CONFLICT();
      }

      throw error;
    }
  });

export const remove = base
  .errors({
    NOT_FOUND: { message: "User not found" },
  })
  .input(z.object({ id: z.number().int() }))
  .output(z.object({ id: z.number().int() }))
  .handler(async ({ input, errors }) => {
    const [user] = await db
      .delete(usersTable)
      .where(eq(usersTable.id, input.id))
      .returning({ id: usersTable.id });

    if (!user) {
      throw errors.NOT_FOUND();
    }

    return user;
  });
