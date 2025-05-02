/**
 * @description
 * Defines TypeScript types and interfaces related to QuickBooks Online (QBO) integration.
 * This includes types for storing authentication tokens and potentially mirroring QBO API object structures.
 *
 * @types
 * - QboTokens: Interface representing the structure of QBO OAuth tokens (access token, refresh token, expiry, realmId).
 * - QboEstimatePayload: Placeholder for the structure needed to create a QBO estimate via the API.
 * - QboCustomerPayload: Placeholder for the structure needed to create/find a QBO customer.
 */

/**
 * @description Interface representing the essential QBO OAuth 2.0 tokens and identifiers needed for API calls.
 * Note: Access and refresh tokens should be stored encrypted in the database,
 * but this type represents their structure when decrypted for use.
 */
export interface QboTokens {
  accessToken: string | null
  refreshToken: string | null
  realmId: string | null
  expiresAt: Date | null // Or timestamp number
}

/**
 * @description Placeholder interface for the data structure required by the QBO API to create an Estimate.
 * This will need to be defined based on the node-quickbooks SDK or QBO API documentation.
 * Example fields might include CustomerRef, Line items, DocNumber, TxnDate, etc.
 */
export interface QboEstimatePayload {
  // Define based on QBO API requirements, e.g.:
  // CustomerRef: { value: string }; // QBO Customer ID
  // Line: Array<{ Description: string; Amount: number; DetailType: string; SalesItemLineDetail?: { ItemRef: { value: string }; Qty?: number; UnitPrice?: number; }; }>;
  // DocNumber?: string;
  // TxnDate?: string; // YYYY-MM-DD
  [key: string]: any // Allow flexibility for now
}

/**
 * @description Placeholder interface for the data structure required to create or find a Customer in QBO.
 */
export interface QboCustomerPayload {
  // Define based on QBO API requirements, e.g.:
  // DisplayName: string;
  // PrimaryEmailAddr?: { Address: string };
  // BillAddr?: { Line1?: string; City?: string; CountrySubDivisionCode?: string; PostalCode?: string; };
  // PrimaryPhone?: { FreeFormNumber: string };
  [key: string]: any
}

// Add other QBO-related types here as needed, e.g., for API responses, error types, etc.
