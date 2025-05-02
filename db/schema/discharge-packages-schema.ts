/**
 * @description
 * Defines the database schema for storing details about discharge packages.
 * This is an example of an admin-managed lookup table used in estimate calculations.
 *
 * @dependencies
 * - drizzle-orm/pg-core: For defining PostgreSQL table schemas.
 *
 * @fields
 * - id: Unique identifier for the discharge package (UUID, Primary Key).
 * - packageCode: The code identifying the package (e.g., 'A', 'B', 'C') (Text, Not Null, Unique).
 * - description: Description of what the package includes (Text, Nullable).
 * - components: Details of components included (e.g., specific parts, materials) (Text, Nullable - could be JSON).
 * - cost: Associated cost or price adjustment for selecting this package (Numeric, Nullable).
 * - createdAt: Timestamp of when the record was created (Timestamp, Not Null, Default Now).
 * - updatedAt: Timestamp of when the record was last updated (Timestamp, Not Null, Default Now, On Update).
 *
 * @indexes
 * - A unique index is added on packageCode.
 *
 * @notes
 * - This table allows admins to define standard discharge package configurations.
 * - The `components` field could store structured data (like JSON) listing parts if needed for detailed breakdowns.
 */

import {
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core"

export const dischargePackagesTable = pgTable(
  "discharge_packages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    packageCode: text("package_code").notNull(), // e.g., 'A', 'B', 'C'
    description: text("description"),
    components: text("components"), // Could potentially be JSONB for structured data
    cost: numeric("cost", { precision: 10, scale: 2 }), // Additive cost or base cost
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date())
  },
  table => {
    return {
      packageCodeIdx: uniqueIndex("discharge_package_code_idx").on(
        table.packageCode
      )
    }
  }
)

export type InsertDischargePackage = typeof dischargePackagesTable.$inferInsert
export type SelectDischargePackage = typeof dischargePackagesTable.$inferSelect
