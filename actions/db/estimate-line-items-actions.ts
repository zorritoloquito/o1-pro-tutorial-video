"use server"

import { db } from "@/db/db"
import {
  estimateLineItemsTable,
  InsertEstimateLineItem,
  SelectEstimateLineItem,
  CalculatedLineItem // Assuming this is defined/exported from schema
} from "@/db/schema"
import { ActionState } from "@/types" // Assuming ActionState is available
import { eq } from "drizzle-orm"
import { Decimal } from "decimal.js"

// Helper Function from Calculator (redundant but keeps actions self-contained if needed)
// Or import from calculator if preferred
function calculateTotal(
  qty: number | string | Decimal,
  rate: number | string | Decimal
): string {
  try {
    const quantity = new Decimal(qty)
    const unitRate = new Decimal(rate)
    if (quantity.isNaN() || unitRate.isNaN()) {
      return "0.00"
    }
    return quantity.times(unitRate).toFixed(2)
  } catch (e) {
    console.error("Error calculating total:", e)
    return "0.00"
  }
}

// Helper to prepare line item data for insertion
// Maps the CalculatedLineItem structure (from calculator) to InsertEstimateLineItem
const prepareLineItemsForInsert = (
  estimateId: string,
  calculatedLineItems: CalculatedLineItem[] // Input is the calculator result type
): InsertEstimateLineItem[] => {
  return calculatedLineItems.map((item) => {
    // Ensure all required fields for InsertEstimateLineItem are present
    // Adjust mapping based on the *actual* structure of CalculatedLineItem vs InsertEstimateLineItem
    return {
      // id: crypto.randomUUID(), // Let DB generate default random UUID
      estimateId: estimateId,
      sortOrder: item.sortOrder,
      description: item.description,
      quantity: item.quantity.toString(), // Ensure stored as string for precision via numeric type
      rate: item.rate.toString(), // Ensure stored as string
      total: item.total.toString(), // Ensure stored as string
      notes: item.notes, // Assuming notes is part of CalculatedLineItem
      isTaxable: item.isTaxable ?? false // Assuming isTaxable is part of CalculatedLineItem
      // Map other fields if they exist on both types
      // Ensure timestamps are handled by DB defaults (`defaultNow`, `$onUpdate`)
    } satisfies Omit<
      InsertEstimateLineItem,
      "id" | "createdAt" | "updatedAt"
    > // Ensure type safety
  })
}

// Function used within createEstimateAction transaction
export async function bulkCreateLineItems(
  estimateId: string,
  calculatedLineItems: CalculatedLineItem[], // Takes calculator output
  tx: typeof db // Pass the transaction instance
): Promise<void> {
  // Changed return type to void as fetching inserted items within tx can be complex
  if (!calculatedLineItems || calculatedLineItems.length === 0) {
    return
  }
  const preparedItems = prepareLineItemsForInsert(
    estimateId,
    calculatedLineItems
  )
  await tx.insert(estimateLineItemsTable).values(preparedItems)
  // If you need the inserted items back, query *after* the transaction commits
}

// Action to replace all line items for an estimate (used in update)
// Note: The updateEstimateAction will now likely perform this logic directly within its own transaction
// Keeping this action might be useful for other scenarios or if refactored later.
export async function replaceEstimateLineItemsAction(
  estimateId: string,
  calculatedLineItems: CalculatedLineItem[] // Takes calculator output
): Promise<ActionState<void>> {
  try {
    await db.transaction(async (tx) => {
      // 1. Delete existing line items
      await tx
        .delete(estimateLineItemsTable)
        .where(eq(estimateLineItemsTable.estimateId, estimateId))

      // 2. Insert new line items (if any)
      if (calculatedLineItems && calculatedLineItems.length > 0) {
        const preparedItems = prepareLineItemsForInsert(
          estimateId,
          calculatedLineItems
        )
        await tx.insert(estimateLineItemsTable).values(preparedItems)
      }
    })
    return {
      isSuccess: true,
      message: "Line items updated successfully",
      data: undefined
    }
  } catch (error: any) {
    console.error("Error replacing estimate line items:", error)
    return {
      isSuccess: false,
      message: `Failed to update line items: ${error.message}`
    }
  }
}

// Get Line Items by Estimate ID Action
export async function getLineItemsByEstimateIdAction(
  estimateId: string
): Promise<ActionState<SelectEstimateLineItem[]>> {
  try {
    const lineItems = await db.query.estimateLineItems.findMany({
      where: eq(estimateLineItemsTable.estimateId, estimateId),
      orderBy: (lineItems, { asc }) => [asc(lineItems.sortOrder)] // Order by sortOrder
    })
    return { isSuccess: true, message: "Line items retrieved", data: lineItems }
  } catch (error: any) {
    console.error("Error getting line items:", error)
    return {
      isSuccess: false,
      message: `Failed to retrieve line items: ${error.message}`
    }
  }
} 