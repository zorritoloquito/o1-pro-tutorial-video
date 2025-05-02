/**
 * @description
 * Defines the database schema for storing client information.
 * Clients are entities for whom estimates are created.
 *
 * @dependencies
 * - drizzle-orm/pg-core: For defining PostgreSQL table schemas.
 *
 * @fields
 * - id: Unique identifier for the client (UUID, Primary Key).
 * - name: Name of the client (Text, Not Null).
 * - contactName: Primary contact person's name (Text, Nullable).
 * - contactEmail: Primary contact person's email (Text, Nullable).
 * - contactPhone: Primary contact person's phone number (Text, Nullable).
 * - address: Client's billing or primary address (Text, Nullable).
 * - createdAt: Timestamp of when the client record was created (Timestamp, Not Null, Default Now).
 * - updatedAt: Timestamp of when the client record was last updated (Timestamp, Not Null, Default Now, On Update).
 *
 * @notes
 * - Consider adding more specific address fields (street, city, state, zip) if needed later.
 * - Validation for email/phone formats should be handled at the application level.
 */

import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const clientsTable = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: text("address"), // Consider splitting into structured address fields later
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertClient = typeof clientsTable.$inferInsert
export type SelectClient = typeof clientsTable.$inferSelect
