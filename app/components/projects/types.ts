/** Shapes returned by `messages.getMany`, shared by the project UI components. */

export interface Fragment {
  id: string;
  messageId: string;
  sandboxUrl: string;
  title: string;
  files: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  projectId: string;
  content: string;
  role: "user" | "assistant";
  type: "result" | "error";
  createdAt: Date;
  updatedAt: Date;
  fragment: Fragment | null;
}
