/**
 * @description
 * Defines the database schema for individual line items within an estimate.
 * Each line item belongs to a specific estimate and details a part of the job.
 *
 * @dependencies
 * - drizzle-orm/pg-core: For defining PostgreSQL table schemas.
 * - ./estimates-schema: Establishes a foreign key relationship to the estimates table.
 *
 * @fields
 * - id: Unique identifier for the line item (UUID, Primary Key).
 * - estimateId: Foreign key referencing the parent estimate (UUID, Not Null).
 * - description: Description of the line item service or material (Text, Not Null).
 * - quantity: The quantity associated with the line item (Numeric, Nullable).
 * - unitPrice: The price per unit for the line item (Numeric, Nullable).
 * - lineTotal: The calculated total for the line item (quantity * unitPrice) (Numeric, Nullable).
 * - notes: Specific notes pertaining to this line item (Text, Nullable).
 * - sortOrder: An integer to control the display order of line items within an estimate (Integer, Not Null, Default 0).
 * - createdAt: Timestamp of when the line item record was created (Timestamp, Not Null, Default Now).
 * - updatedAt: Timestamp of when the line item record was last updated (Timestamp, Not Null, Default Now, On Update).
 *
 * @indexes
 * - An index is added on estimateId for efficient retrieval of all line items for a given estimate.
 *
 * @notes
 * - `unitPrice` and `lineTotal` use numeric types for financial accuracy.
 * - `quantity` is numeric to allow for fractional quantities if needed (e.g., 1.5 hours).
 * - The foreign key constraint with `onDelete: "cascade"` ensures line items are removed if their parent estimate is deleted.
 * - `lineTotal` might be calculated dynamically in the application or stored pre-calculated here. Storing it simplifies retrieval but requires updates if quantity/unitPrice change. The schema currently allows nullable to accommodate items without a calculated total (e.g., descriptive lines). Spec implies calculation, so it might become non-nullable.
 */

import {
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  boolean
} from "drizzle-orm/pg-core" // Added boolean
import { estimatesTable } from "./estimates-schema"

export const estimateLineItemsTable = pgTable("estimate_line_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  estimateId: uuid("estimate_id")
    .notNull()
    .references(() => estimatesTable.id, { onDelete: "cascade" }),
  // sortOrder helps maintain the 1-11 sequence, especially if custom lines are added later
  sortOrder: integer("sort_order").notNull(),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 })
    .default("1")
    .notNull(),
  rate: numeric("rate", { precision: 10, scale: 2 }).default("0").notNull(),
  // Total should ideally be calculated dynamically or via DB trigger,
  // but storing it simplifies reads. Ensure it's updated correctly.
  total: numeric("total", { precision: 10, scale: 2 }).default("0").notNull(),
  isTaxable: boolean("is_taxable").default(false).notNull(), // Kept for QBO/future use
  notes: text("notes"), // Allow adding notes later
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertEstimateLineItem = typeof estimateLineItemsTable.$inferInsert
export type SelectEstimateLineItem = typeof estimateLineItemsTable.$inferSelect

// Type for the data returned by the calculator before saving
export interface CalculatedLineItem {
  sortOrder: number
  description: string
  quantity: number | string // Allow string for precision
  rate: number | string // Allow string for precision
  total: number | string // Allow string for precision
  notes?: string | null
  isTaxable?: boolean
}
