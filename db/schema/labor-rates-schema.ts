/**
 * @description
 * Defines the database schema for storing labor rates.
 * This data is managed via the Admin interface and used in estimate calculations.
 *
 * @dependencies
 * - drizzle-orm/pg-core: For defining PostgreSQL table schemas.
 *
 * @fields
 * - id: Unique identifier for the labor rate entry (UUID, Primary Key).
 * - laborType: Type or category of labor (e.g., 'Prep', 'Install', 'Startup', 'Standard') (Text, Not Null, Unique).
 * - description: Optional description of the labor type (Text, Nullable).
 * - ratePerHour: The hourly rate for this type of labor (Numeric, Not Null, Default 0.00).
 * - createdAt: Timestamp of when the labor rate record was created (Timestamp, Not Null, Default Now).
 * - updatedAt: Timestamp of when the labor rate record was last updated (Timestamp, Not Null, Default Now, On Update).
 *
 * @indexes
 * - A unique index is added on `laborType` to ensure each type has only one rate entry.
 *
 * @notes
 * - This table centralizes labor costs for consistent use in estimates.
 * - `ratePerHour` uses a numeric type for financial accuracy.
 */

import {
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core"

export const laborRatesTable = pgTable(
  "labor_rates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    laborType: text("labor_type").notNull(), // e.g., 'Prep', 'Install', 'Startup', 'Standard'
    description: text("description"),
    ratePerHour: numeric("rate_per_hour", { precision: 10, scale: 2 })
      .notNull()
      .default("0.00"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date())
  },
  table => {
    return {
      laborTypeIdx: uniqueIndex("labor_type_idx").on(table.laborType)
    }
  }
)

export type InsertLaborRate = typeof laborRatesTable.$inferInsert
export type SelectLaborRate = typeof laborRatesTable.$inferSelect
