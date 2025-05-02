/**
 * @description
 * Defines the database schema for storing equipment information and rates.
 * This data is managed via the Admin interface and may be used in estimate calculations or line items.
 *
 * @dependencies
 * - drizzle-orm/pg-core: For defining PostgreSQL table schemas.
 *
 * @fields
 * - id: Unique identifier for the equipment entry (UUID, Primary Key).
 * - name: Name of the equipment (Text, Not Null, Unique).
 * - description: Detailed description of the equipment (Text, Nullable).
 * - rate: The rate associated with using the equipment (e.g., hourly, daily, per job) (Numeric, Nullable).
 * - rateUnit: The unit for the rate (e.g., 'hour', 'day', 'job') (Text, Nullable).
 * - cost: A fixed cost associated with the equipment if applicable (Numeric, Nullable).
 * - createdAt: Timestamp of when the equipment record was created (Timestamp, Not Null, Default Now).
 * - updatedAt: Timestamp of when the equipment record was last updated (Timestamp, Not Null, Default Now, On Update).
 *
 * @indexes
 * - A unique index is added on the equipment name.
 *
 * @notes
 * - This table allows tracking equipment potentially used in jobs.
 * - `rate` and `cost` use numeric types for financial accuracy.
 */

import {
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core"

export const equipmentTable = pgTable(
  "equipment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    rate: numeric("rate", { precision: 10, scale: 2 }), // e.g., cost per hour, per day
    rateUnit: text("rate_unit"), // e.g., 'hour', 'day', 'job'
    cost: numeric("cost", { precision: 10, scale: 2 }), // Fixed cost if applicable
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date())
  },
  table => {
    return {
      nameIdx: uniqueIndex("equipment_name_idx").on(table.name)
    }
  }
)

export type InsertEquipment = typeof equipmentTable.$inferInsert
export type SelectEquipment = typeof equipmentTable.$inferSelect
