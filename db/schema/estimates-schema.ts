/**
 * @description
 * Defines the database schema for storing project estimates.
 * This is a central table linking users, clients, sites, and estimate details including financial summaries.
 *
 * @dependencies
 * - drizzle-orm/pg-core: For defining PostgreSQL table schemas.
 * - ./profiles-schema: For linking to the user profile (potential future use for non-Clerk user ID).
 * - ./clients-schema: For linking to the client associated with the estimate.
 * - ./sites-schema: For linking to the project site associated with the estimate.
 *
 * @fields
 * - id: Unique identifier for the estimate (UUID, Primary Key).
 * - userId: Identifier for the user who created the estimate (Text, Not Null - typically Clerk user ID).
 * - clientId: Foreign key referencing the client (UUID, Not Null).
 * - siteId: Foreign key referencing the site (UUID, Not Null).
 * - estimateNumber: A user-facing unique identifier for the estimate (Text, Not Null, Unique).
 * - status: Current status of the estimate (Text, Not Null, Default 'draft', e.g., 'draft', 'approved', 'synced', 'sent').
 * - gpm: Gallons per minute input (Numeric, Nullable).
 * - ps: Pump Setting input in feet (Numeric, Nullable).
 * - pwl: Pumping Water Level input in feet (Numeric, Nullable).
 * - psi: Pressure input in PSI (Numeric, Nullable).
 * - voltage: Voltage input (Numeric, Nullable).
 * - prepTimeHours: Time to prep job input in hours (Numeric, Nullable).
 * - installTimeHours: Time to install pump input in hours (Numeric, Nullable).
 * - startupTimeHours: Start-up time input in hours (Numeric, Nullable).
 * - dischargePackage: Selected discharge package identifier (Text, Nullable, e.g., 'A', 'B', 'C').
 * - overallNotes: General notes pertaining to the entire estimate (Text, Nullable).
 * - subtotalAmount: Calculated sum of all line item totals before tax (Numeric, Not Null, Default 0.00).
 * - taxRate: Sales tax rate applied to the estimate (Numeric, Nullable, Default 0.00).
 * - taxAmount: Calculated tax amount (Numeric, Not Null, Default 0.00).
 * - totalAmount: Grand total including subtotal and tax (Numeric, Not Null, Default 0.00).
 * - qboEstimateId: Identifier of the corresponding estimate in QuickBooks Online (Text, Nullable).
 * - approvedAt: Timestamp when the estimate was approved (Timestamp, Nullable).
 * - createdAt: Timestamp of when the estimate record was created (Timestamp, Not Null, Default Now).
 * - updatedAt: Timestamp of when the estimate record was last updated (Timestamp, Not Null, Default Now, On Update).
 *
 * @indexes
 * - Indexes are added on userId, clientId, and status for potentially faster lookups.
 *
 * @notes
 * - `status` could be an enum if the states are strictly defined.
 * - Numeric types are used for financial values and measurements. Consider precision settings if required.
 * - Foreign key constraints ensure data integrity. `onDelete: "cascade"` is used for clients and sites, meaning estimates are deleted if the parent client/site is deleted. Adjust if different behavior is needed (e.g., `set null` or `restrict`).
 */
import {
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core"
import { clientsTable } from "./clients-schema"
import { sitesTable } from "./sites-schema"
// Assuming profilesTable might be needed if linking directly to a DB user ID instead of Clerk's text ID is ever required.
// import { profilesTable } from "./profiles-schema";

export const estimatesTable = pgTable(
  "estimates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(), // Link to Clerk user ID
    clientId: uuid("client_id")
      .references(() => clientsTable.id, { onDelete: "cascade" })
      .notNull(),
    siteId: uuid("site_id")
      .references(() => sitesTable.id, { onDelete: "cascade" })
      .notNull(),
    estimateNumber: text("estimate_number").notNull(),
    status: text("status").default("draft").notNull(), // e.g., 'draft', 'approved', 'synced', 'sent'
    // --- Input Fields ---
    gpm: numeric("gpm"), // Gallons per minute
    ps: numeric("ps"), // Pump Setting (feet)
    pwl: numeric("pwl"), // Pumping Water Level (feet)
    psi: numeric("psi"), // Pressure (PSI)
    voltage: numeric("voltage"), // Voltage (V)
    prepTimeHours: numeric("prep_time_hours"),
    installTimeHours: numeric("install_time_hours"),
    startupTimeHours: numeric("startup_time_hours"),
    dischargePackage: text("discharge_package"), // e.g., 'A', 'B', 'C'
    // --- Notes ---
    overallNotes: text("overall_notes"),
    // --- Calculated Financials ---
    subtotalAmount: numeric("subtotal_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0.00"),
    taxRate: numeric("tax_rate", { precision: 5, scale: 4 }).default("0.00"), // Store rate like 0.08 for 8%
    taxAmount: numeric("tax_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0.00"),
    totalAmount: numeric("total_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0.00"),
    // --- Integration & Status ---
    qboEstimateId: text("qbo_estimate_id"),
    approvedAt: timestamp("approved_at"),
    // --- Timestamps ---
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date())
  },
  table => {
    return {
      estimateNumberIdx: uniqueIndex("estimate_number_idx").on(
        table.estimateNumber
      ),
      userIdIdx: index("estimate_user_id_idx").on(table.userId),
      clientIdIdx: index("estimate_client_id_idx").on(table.clientId),
      statusIdx: index("estimate_status_idx").on(table.status)
    }
  }
)

export type InsertEstimate = typeof estimatesTable.$inferInsert
export type SelectEstimate = typeof estimatesTable.$inferSelect
