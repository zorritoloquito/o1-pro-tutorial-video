/**
 * @description
 * Defines the database schema for storing materials information.
 * This data is managed via the Admin interface and used in estimate calculations.
 *
 * @dependencies
 * - drizzle-orm/pg-core: For defining PostgreSQL table schemas.
 *
 * @fields
 * - id: Unique identifier for the material (UUID, Primary Key).
 * - name: Name of the material (Text, Not Null, Unique).
 * - description: Detailed description of the material (Text, Nullable).
 * - unit: The unit of measurement for the material (e.g., 'foot', 'bag', 'each') (Text, Nullable).
 * - cost: The cost per unit of the material (Numeric, Not Null, Default 0.00).
 * - createdAt: Timestamp of when the material record was created (Timestamp, Not Null, Default Now).
 * - updatedAt: Timestamp of when the material record was last updated (Timestamp, Not Null, Default Now, On Update).
 *
 * @indexes
 * - A unique index is added on the material name to prevent duplicates.
 *
 * @notes
 * - This table serves as a price list for materials used in estimates.
 * - `cost` uses a numeric type for financial accuracy.
 */

import {
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core"

export const materialsTable = pgTable(
  "materials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    unit: text("unit"), // e.g., 'foot', 'bag', 'each', 'hour'
    cost: numeric("cost", { precision: 10, scale: 2 }) // Cost per unit
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
      nameIdx: uniqueIndex("material_name_idx").on(table.name)
    }
  }
)

export type InsertMaterial = typeof materialsTable.$inferInsert
export type SelectMaterial = typeof materialsTable.$inferSelect
