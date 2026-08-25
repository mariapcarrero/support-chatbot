import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * One chat session. Identity is an anonymous cookie (`cadre_sid`) — there are no user
 * accounts. `status` flips to "escalated" when a human has been pulled in, which is the
 * flag the inbound team would filter on.
 */
export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: text("session_id").notNull(),
    status: text("status", { enum: ["active", "escalated"] })
      .notNull()
      .default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("conversations_session_idx").on(table.sessionId)],
);

/**
 * Transcript.
 *
 * `content` stores the full Anthropic content-block array as JSON rather than flattened
 * text. Flattening would discard tool_use and tool_result blocks, and the API requires
 * those to replay a conversation that involved tools — a text-only transcript cannot be
 * resumed correctly.
 */
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["user", "assistant"] }).notNull(),
    content: jsonb("content").notNull(),
    /** Token usage for the assistant turn, incl. cache hit counters. Null for user turns. */
    usage: jsonb("usage"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("messages_conversation_idx").on(table.conversationId, table.createdAt)],
);

/** Captured contact, from either `book_strategy_call` or `capture_lead`. */
export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    company: text("company"),
    industry: text("industry"),
    companySize: text("company_size"),
    interest: text("interest").notNull(),
    /** Which tool produced this row — booking intent and nurture intent are different. */
    sourceTool: text("source_tool", { enum: ["book_strategy_call", "capture_lead"] }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("leads_email_idx").on(table.email)],
);

/** A handoff to a human, with the short reference the user is given in chat. */
export const escalations = pgTable(
  "escalations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    reference: text("reference").notNull().unique(),
    category: text("category", {
      enum: ["contractual", "account_specific", "commercial", "complaint", "unanswerable", "other"],
    }).notNull(),
    reason: text("reason").notNull(),
    contactEmail: text("contact_email"),
    status: text("status", { enum: ["open", "resolved"] })
      .notNull()
      .default("open"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("escalations_status_idx").on(table.status, table.createdAt)],
);

/** A completed in-chat AI Maturity Index self-assessment. */
export const maturityAssessments = pgTable("maturity_assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  dimensionScores: jsonb("dimension_scores").notNull(),
  overall: real("overall").notNull(),
  tier: text("tier").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
  leads: many(leads),
  escalations: many(escalations),
  maturityAssessments: many(maturityAssessments),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type Escalation = typeof escalations.$inferSelect;
