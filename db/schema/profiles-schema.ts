/**
 * @description
 * Defines the database schema for user profiles.
 * Extends the basic profile with application-specific roles and integration tokens.
 *
 * @dependencies
 * - drizzle-orm/pg-core: For defining PostgreSQL table schemas.
 *
 * @fields
 * - userId: Primary key, matches the Clerk user ID (Text, PK, Not Null).
 * - membership: User's subscription level (Enum ['free', 'pro'], Not Null, Default 'free') - Currently unused for Belknap.
 * - stripeCustomerId: Stripe customer ID (Text, Nullable) - Currently unused for Belknap.
 * - stripeSubscriptionId: Stripe subscription ID (Text, Nullable) - Currently unused for Belknap.
 * - isAdmin: Flag indicating if the user has administrative privileges (Boolean, Not Null, Default false).
 * - qboRealmId: QuickBooks Online company identifier (Realm ID) (Text, Nullable).
 * - qboAccessToken: Encrypted QBO access token (Text, Nullable).
 * - qboRefreshToken: Encrypted QBO refresh token (Text, Nullable).
 * - qboTokenExpiresAt: Timestamp indicating when the QBO access token expires (Timestamp, Nullable).
 * - createdAt: Timestamp of profile creation (Timestamp, Not Null, Default Now).
 * - updatedAt: Timestamp of last profile update (Timestamp, Not Null, Default Now, On Update).
 *
 * @notes
 * - `isAdmin` controls access to the /admin section.
 * - QBO tokens (`qboAccessToken`, `qboRefreshToken`) MUST be encrypted by the application before storing in the database for security. The schema defines them as text, but the application logic handles encryption/decryption.
 * - Stripe fields are kept for template consistency but are not actively used in the Belknap feature set.
 */

import { boolean, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"

// Membership enum - kept for template structure, not used by Belknap core features
export const membershipEnum = pgEnum("membership", ["free", "pro"])

export const profilesTable = pgTable("profiles", {
  userId: text("user_id").primaryKey().notNull(), // From Clerk auth

  // --- Standard Template Fields (Unused in Belknap) ---
  membership: membershipEnum("membership").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),

  // --- Belknap Specific Fields ---
  isAdmin: boolean("is_admin").notNull().default(false), // For admin access control

  // --- QuickBooks Online Integration Fields ---
  qboRealmId: text("qbo_realm_id"), // Company ID in QBO
  qboAccessToken: text("qbo_access_token"), // STORE ENCRYPTED
  qboRefreshToken: text("qbo_refresh_token"), // STORE ENCRYPTED
  qboTokenExpiresAt: timestamp("qbo_token_expires_at"), // Expiry timestamp for the access token

  // --- Timestamps ---
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertProfile = typeof profilesTable.$inferInsert
export type SelectProfile = typeof profilesTable.$inferSelect
