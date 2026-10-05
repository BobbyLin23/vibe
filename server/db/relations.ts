import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

/**
 * Relational config for the Drizzle v1 query builder (`db.query.*`).
 *
 * A message owns many fragments (`messages.id` ← `fragments.message_id`, cascade
 * delete). Only the `one` side carries the explicit column mapping; the reverse
 * `many` side infers it.
 */
export const relations = defineRelations(schema, (r) => ({
  messages: {
    fragments: r.many.fragments(),
  },
  fragments: {
    message: r.one.messages({
      from: r.fragments.messageId,
      to: r.messages.id,
      optional: false,
    }),
  },
}));
