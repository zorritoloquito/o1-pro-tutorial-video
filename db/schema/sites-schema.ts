/**
 * @description
 * Defines the database schema for storing project site information.
 * Each site is linked to a client and represents the location for a potential job.
 *
 * @dependencies
 * - drizzle-orm/pg-core: For defining PostgreSQL table schemas.
 * - ./clients-schema: Establishes a foreign key relationship to the clients table.
 *
 * @fields
 * - id: Unique identifier for the site (UUID, Primary Key).
 * - clientId: Foreign key referencing the associated client (UUID, Not Null).
 * - address: Physical address of the project site (Text, Nullable).
 * - coordinates: Geographic coordinates (e.g., latitude, longitude) (Text, Nullable).
 * - intendedUse: The intended use of the well (e.g., residential, commercial) (Text, Nullable).
 * - createdAt: Timestamp of when the site record was created (Timestamp, Not Null, Default Now).
 * - updatedAt: Timestamp of when the site record was last updated (Timestamp, Not Null, Default Now, On Update).
 *
 * @notes
 * - `coordinates` could be stored in a more specific geo-type if the database supports it and complex queries are needed.
 * - `intendedUse` could be constrained by an enum if the list is fixed.
 * - The foreign key constraint ensures data integrity between sites and clients.
 */

import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { clientsTable } from "./clients-schema" // Import the clients table for the relationship

export const sitesTable = pgTable("sites", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id")
    .references(() => clientsTable.id, { onDelete: "cascade" }) // Link to clients table, cascade delete if client is removed
    .notNull(),
  address: text("address"),
  coordinates: text("coordinates"), // e.g., "40.7128,-74.0060"
  intendedUse: text("intended_use"), // e.g., "residential", "agricultural"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertSite = typeof sitesTable.$inferInsert
export type SelectSite = typeof sitesTable.$inferSelect
