/**
 * @description
 * Initializes the Drizzle ORM client for the PostgreSQL database.
 * Imports all table schemas and includes them in the Drizzle configuration,
 * enabling type-safe database interactions throughout the application.
 *
 * @dependencies
 * - dotenv: Loads environment variables from .env.local.
 * - drizzle-orm/postgres-js: Drizzle adapter for the postgres.js driver.
 * - postgres: PostgreSQL client library.
 * - @/db/schema: Imports all defined table schemas.
 *
 * @configuration
 * - Reads DATABASE_URL from environment variables.
 * - Creates a postgres client instance.
 * - Initializes Drizzle with the client and the combined schema object.
 */

import {
  clientsTable,
  dischargePackagesTable,
  equipmentTable,
  estimateLineItemsTable,
  estimatesTable,
  laborRatesTable,
  materialsTable,
  profilesTable,
  settingsTable,
  sitesTable
} from "@/db/schema"
import { config } from "dotenv"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

// Load environment variables from .env.local
config({ path: ".env.local" })

// Combine all schemas into a single object for Drizzle
const schema = {
  profiles: profilesTable,
  clients: clientsTable,
  sites: sitesTable,
  estimates: estimatesTable,
  estimateLineItems: estimateLineItemsTable,
  materials: materialsTable,
  laborRates: laborRatesTable,
  equipment: equipmentTable,
  dischargePackages: dischargePackagesTable,
  settings: settingsTable
}

// Validate that the DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set.")
}

// Create the PostgreSQL client connection
const client = postgres(process.env.DATABASE_URL)

// Initialize Drizzle ORM with the client and schema
export const db = drizzle(client, { schema })
