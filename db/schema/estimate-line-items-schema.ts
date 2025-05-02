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
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid
} from "drizzle-orm/pg-core"
import { estimatesTable } from "@/db/schema/estimates-schema"

export const estimateLineItemsTable = pgTable(
  "estimate_line_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    estimateId: uuid("estimate_id")
      .references(() => estimatesTable.id, { onDelete: "cascade" }) // Link to estimates, cascade delete
      .notNull(),
    description: text("description").notNull(),
    quantity: numeric("quantity", { precision: 10, scale: 2 }), // Allows for e.g., 1.5 hours
    unitPrice: numeric("unit_price", { precision: 10, scale: 2 }), // e.g., price per foot, price per hour
    lineTotal: numeric("line_total", { precision: 10, scale: 2 }), // Calculated: quantity * unitPrice
    notes: text("notes"),
    sortOrder: integer("sort_order").default(0).notNull(), // For ordering items in the UI/PDF
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date())
  },
  table => {
    return {
      estimateIdIdx: index("line_item_estimate_id_idx").on(table.estimateId)
    }
  }
)

export type InsertEstimateLineItem = typeof estimateLineItemsTable.$inferInsert
export type SelectEstimateLineItem = typeof estimateLineItemsTable.$inferSelect
