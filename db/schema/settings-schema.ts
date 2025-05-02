/**
 * @description
 * Defines the database schema for storing global application settings.
 * This table is intended to hold a single row containing configuration managed via the Admin interface.
 *
 * @dependencies
 * - drizzle-orm/pg-core: For defining PostgreSQL table schemas.
 *
 * @fields
 * - id: Unique identifier, often fixed to ensure only one row exists (Integer, Primary Key, Default 1).
 * - companyName: Name of the company using the application (Text, Nullable).
 * - companyAddress: Company's address (Text, Nullable).
 * - companyPhone: Company's phone number (Text, Nullable).
 * - companyEmail: Company's email address (Text, Nullable).
 * - companyLogoUrl: URL to the company logo image (Text, Nullable).
 * - defaultSalesTaxRate: Default sales tax rate to apply (Numeric, Nullable - overrides .env if set).
 * - emailFromName: The 'From' name to use in emails (Text, Nullable).
 * - emailFromAddress: The 'From' email address (Text, Nullable - overrides .env if set).
 * - qboClientId: QuickBooks Online Client ID (Text, Nullable - overrides .env if set).
 * - qboClientSecret: QuickBooks Online Client Secret (Text, Nullable - overrides .env if set, STORE ENCRYPTED).
 * - qboRedirectUri: QuickBooks Online Redirect URI (Text, Nullable - overrides .env if set).
 * - qboEnvironment: QuickBooks Online Environment ('sandbox' or 'production') (Text, Nullable - overrides .env if set).
 * - createdAt: Timestamp of when the settings record was created (Timestamp, Not Null, Default Now).
 * - updatedAt: Timestamp of when the settings record was last updated (Timestamp, Not Null, Default Now, On Update).
 *
 * @notes
 * - This table typically holds only one row. The `id` field could be constrained to 1.
 * - Sensitive fields like `qboClientSecret` should be encrypted before storing in the database. The schema definition itself doesn't enforce encryption; this must be handled at the application layer (e.g., in server actions).
 * - Fields here can provide overrides for values set in environment variables.
 */

import { integer, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const settingsTable = pgTable("settings", {
  // Using integer PK, assuming only one row (ID=1) will exist.
  // Alternatively, use boolean 'is_active' or similar if multiple drafts are needed.
  id: integer("id").primaryKey().default(1),
  companyName: text("company_name"),
  companyAddress: text("company_address"),
  companyPhone: text("company_phone"),
  companyEmail: text("company_email"),
  companyLogoUrl: text("company_logo_url"), // URL to logo stored elsewhere (e.g., Supabase Storage)
  defaultSalesTaxRate: numeric("default_sales_tax_rate", {
    precision: 5,
    scale: 4
  }), // e.g., 0.08 for 8%
  emailFromName: text("email_from_name"),
  emailFromAddress: text("email_from_address"),
  // QBO App Credentials (Consider encrypting Secret)
  qboClientId: text("qbo_client_id"),
  qboClientSecret: text("qbo_client_secret"), // STORE ENCRYPTED
  qboRedirectUri: text("qbo_redirect_uri"),
  qboEnvironment: text("qbo_environment").default("sandbox"), // 'sandbox' or 'production'
  // --- Timestamps ---
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertSetting = typeof settingsTable.$inferInsert
export type SelectSetting = typeof settingsTable.$inferSelect
