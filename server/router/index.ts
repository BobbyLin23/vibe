import { greet } from "./hello";
import { create, list, remove } from "./users";

export const router = {
  hello: { greet },
  user: { list, create, remove },
};
