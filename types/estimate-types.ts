/**
 * @description
 * Defines TypeScript types and interfaces related to the estimate feature.
 * This includes enums, specific type aliases, and potentially more complex aggregated types.
 *
 * @dependencies
 * - @/db/schema: Imports database select types (e.g., SelectEstimate, SelectClient).
 *
 * @types
 * - EstimateStatus: An enum or union type defining possible estimate statuses.
 * - DischargePackageOption: An enum or union type for the discharge package choices.
 * - EstimateWithDetails: An example of a potentially complex type combining estimate data with related client, site, and line item data.
 */

import type {
  SelectClient,
  SelectEstimate,
  SelectEstimateLineItem,
  SelectSite
} from "@/db/schema"

/**
 * @description Represents the possible statuses an estimate can have.
 */
export type EstimateStatus =
  | "draft"
  | "approved"
  | "synced"
  | "sent"
  | "archived"

/**
 * @description Represents the available discharge package options.
 */
export type DischargePackageOption = "A" | "B" | "C"

/**
 * @description Interface representing a complete estimate object, including related data.
 * Useful for passing comprehensive estimate data between server and client components or actions.
 * This type structure might evolve as features are implemented.
 */
export interface EstimateWithDetails extends SelectEstimate {
  client: SelectClient | null
  site: SelectSite | null
  lineItems: SelectEstimateLineItem[]
}

// Add other estimate-related types here as needed, for example:
// - Types for the calculation engine inputs/outputs
// - Types for specific form structures
