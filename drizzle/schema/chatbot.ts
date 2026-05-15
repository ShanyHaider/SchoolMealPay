import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { id, createdAt, updatedAt } from "../schemaHelpers";
import { usersTable } from "./users";

// One row per conversation session.
// userContext is a snapshot of the user's role, dietary prefs, linked children etc.
// Stored at session start so the AI system prompt can be rebuilt from one column
// without joining six tables on every message.
export const chatbotConversationsTable = pgTable(
  "chatbot_conversations",
  {
    id,
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    userContext: jsonb("user_context"),
    topic: varchar(), // "ordering" | "nutrition" | "payments" | "technical"
    createdAt,
    updatedAt,
  },
  (t) => [index("chatbot_conversations_user_idx").on(t.userId)],
);

export const chatMessageRoleEnum = pgEnum("chat_message_role", [
  "user",
  "assistant",
]);

// FIX: was a single JSONB array on the conversation row — it grew unboundedly,
// killed query performance, and made pagination/search impossible.
// Now each message is its own row, queryable and pageable.
// To reconstruct conversation context for the AI: ORDER BY created_at ASC,
// take the last N rows, map to { role, content } array for the API call.
export const chatbotMessagesTable = pgTable(
  "chatbot_messages",
  {
    id,
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => chatbotConversationsTable.id, { onDelete: "cascade" }),
    role: chatMessageRoleEnum().notNull(),
    content: text().notNull(),
    createdAt,
  },
  (t) => [index("chatbot_messages_conversation_idx").on(t.conversationId)],
);
