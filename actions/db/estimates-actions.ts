"use server"

import { db } from "@/db/db"
import {
  estimatesTable,
  InsertEstimate,
  SelectEstimate,
  estimateLineItemsTable,
  InsertEstimateLineItem,
  SelectEstimateLineItem,
  CalculatedLineItem,
  clientsTable,
  sitesTable
} from "@/db/schema"
import {
  ActionState,
  EstimateSaveData,
  EstimateUpdateData,
  EstimateWithDetails,
  CalculationResult
} from "@/types"
import { eq, desc, and, sql, type Column } from "drizzle-orm"
import { calculateEstimateLineItems } from "@/lib/calculations/estimate-calculator"
import { bulkCreateLineItems } from "./estimate-line-items-actions"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { Decimal } from "decimal.js"

// Helper Function from Calculator (redundant but keeps actions self-contained if needed)
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

// Helper to prepare line item data for insertion (specific to this file context)
const prepareLineItemsForSave = (
  estimateId: string,
  calculatedLineItems: CalculatedLineItem[]
): InsertEstimateLineItem[] => {
  return calculatedLineItems.map((item) => ({
    estimateId: estimateId,
    sortOrder: item.sortOrder,
    description: item.description,
    quantity: item.quantity.toString(),
    rate: item.rate.toString(),
    total: item.total.toString(),
    notes: item.notes,
    isTaxable: item.isTaxable ?? false
    // Let DB handle id, createdAt, updatedAt
  }))
}

// Helper function to generate a unique estimate number
async function generateEstimateNumber(): Promise<string> {
  // Get the current year
  const year = new Date().getFullYear()
  
  // Get the count of estimates for this year
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(estimatesTable)
    .where(sql`extract(year from created_at) = ${year}`)

  const count = result[0]?.count ?? 0
  const nextNumber = count + 1

  // Format: YYYY-XXXX where XXXX is padded with zeros
  return `${year}-${nextNumber.toString().padStart(4, '0')}`
}

// --- Create Estimate Action ---
export async function createEstimateAction(
  saveData: EstimateSaveData
): Promise<ActionState<{ estimateId: string }>> {
  const { userId } = await auth()
  if (!userId || userId !== saveData.userId) {
    return { isSuccess: false, message: "Unauthorized" }
  }

  // 1. Calculate the line items
  const calculationResult = await calculateEstimateLineItems({
    gpm: saveData.gpm,
    pumpSetting: saveData.pumpSetting,
    pumpingWaterLevel: saveData.pumpingWaterLevel,
    pressurePsi: saveData.pressurePsi,
    voltage: saveData.voltage,
    prepTimeHours: saveData.prepTimeHours,
    installTimeHours: saveData.installTimeHours,
    startTimeHours: saveData.startTimeHours,
    dischargePackage: saveData.dischargePackage
  })

  if (!calculationResult.isSuccess || !calculationResult.data) {
    return {
      isSuccess: false,
      message: calculationResult.message ?? "Calculation failed"
    }
  }

  const calculatedLineItems = calculationResult.data

  // Calculate total cost from prepared line items
  const totalCost = calculatedLineItems
    .reduce((sum, item) => sum.plus(new Decimal(item.total)), new Decimal(0))
    .toFixed(2)

  // 2. Save Estimate and Line Items in a Transaction
  try {
    const newEstimateId = crypto.randomUUID()
    const estimateNumber = await generateEstimateNumber()

    await db.transaction(async (tx) => {
      // Create a site first
      const [newSite] = await tx.insert(sitesTable).values({
        clientId: saveData.customerId,
        address: saveData.siteAddressLine1,
        coordinates: saveData.siteCoordinates,
        intendedUse: saveData.intendedUse
      }).returning()

      // Insert Estimate Header
      await tx.insert(estimatesTable).values({
        id: newEstimateId,
        userId: saveData.userId,
        clientId: saveData.customerId,
        siteId: newSite.id,
        estimateNumber,
        status: "draft",
        gpm: saveData.gpm.toString(),
        ps: saveData.pumpSetting.toString(),
        pwl: saveData.pumpingWaterLevel.toString(),
        psi: saveData.pressurePsi.toString(),
        voltage: saveData.voltage.toString(),
        prepTimeHours: saveData.prepTimeHours.toString(),
        installTimeHours: saveData.installTimeHours.toString(),
        startupTimeHours: saveData.startTimeHours.toString(),
        dischargePackage: saveData.dischargePackage,
        overallNotes: saveData.notes,
        totalAmount: totalCost
      })

      // Bulk Insert Line Items
      const lineItemsToInsert = prepareLineItemsForSave(
        newEstimateId,
        calculatedLineItems
      )
      if (lineItemsToInsert.length > 0) {
        await tx.insert(estimateLineItemsTable).values(lineItemsToInsert)
      }
    })

    revalidatePath("/estimates")
    revalidatePath(`/estimates/${newEstimateId}`)

    return {
      isSuccess: true,
      message: "Estimate created successfully",
      data: { estimateId: newEstimateId }
    }
  } catch (error: any) {
    console.error("Error creating estimate:", error)
    return {
      isSuccess: false,
      message: `Failed to create estimate: ${error.message}`
    }
  }
}

// --- Get Estimate By ID --- Type adjusted slightly for clarity
export async function getEstimateByIdAction(
  estimateId: string
): Promise<ActionState<EstimateWithDetails>> {
  const { userId } = await auth()
  if (!userId) return { isSuccess: false, message: "Unauthorized" }

  try {
    const estimate = await db.query.estimates.findFirst({
      where: and(eq(estimatesTable.id, estimateId), eq(estimatesTable.userId, userId)),
      with: {
        client: true,
        site: true,
        lineItems: {
          orderBy: (lineItems: { sortOrder: Column }, { asc }: { asc: (column: Column) => any }) => [asc(lineItems.sortOrder)]
        }
      }
    })

    if (!estimate) {
      return { isSuccess: false, message: "Estimate not found or access denied" }
    }

    return { isSuccess: true, message: "Estimate retrieved", data: estimate }
  } catch (error: any) {
    console.error("Error getting estimate by ID:", error)
    return {
      isSuccess: false,
      message: `Failed to retrieve estimate: ${error.message}`
    }
  }
}

// --- List Estimates for User ---
export async function getEstimatesByUserIdAction(
  itemsPerPage = 10,
  currentPage = 1
): Promise<
  ActionState<{
    estimates: SelectEstimate[]
    totalCount: number
  }>
> {
  const { userId } = await auth()
  if (!userId) return { isSuccess: false, message: "Unauthorized" }

  const offset = (currentPage - 1) * itemsPerPage

  try {
    const estimatesQuery = db.query.estimates.findMany({
      where: eq(estimatesTable.userId, userId),
      with: {
        client: true,
        site: true
      },
      orderBy: (estimates, { desc }) => [desc(estimates.createdAt)],
      limit: itemsPerPage,
      offset: offset
    })

    const totalCountQuery = db
      .select({ count: sql<number>`count(*)::int` })
      .from(estimatesTable)
      .where(eq(estimatesTable.userId, userId))

    const [estimates, totalCountResult] = await Promise.all([
      estimatesQuery,
      totalCountQuery
    ])
    const totalCount = totalCountResult[0]?.count ?? 0

    return {
      isSuccess: true,
      message: "Estimates retrieved",
      data: { estimates, totalCount }
    }
  } catch (error: any) {
    console.error("Error getting estimates:", error)
    return {
      isSuccess: false,
      message: `Failed to retrieve estimates: ${error.message}`
    }
  }
}

// --- Update Estimate Action ---
export async function updateEstimateAction(
  updateData: EstimateUpdateData
): Promise<ActionState<void>> {
  const { userId } = await auth()
  if (!userId || userId !== updateData.userId) {
    return { isSuccess: false, message: "Unauthorized to update this estimate" }
  }

  try {
    await db.transaction(async (tx) => {
      if (Object.keys(updateData.estimateData).length > 0) {
        await tx
          .update(estimatesTable)
          .set({ ...updateData.estimateData, updatedAt: new Date() })
          .where(
            and(
              eq(estimatesTable.id, updateData.estimateId),
              eq(estimatesTable.userId, userId)
            )
          )
      }

      await tx
        .delete(estimateLineItemsTable)
        .where(eq(estimateLineItemsTable.estimateId, updateData.estimateId))

      if (updateData.lineItems && updateData.lineItems.length > 0) {
        const itemsToInsert = updateData.lineItems.map((item) => ({
          ...item,
          estimateId: updateData.estimateId,
          total: calculateTotal(item.quantity ?? 1, item.rate ?? 0),
          quantity: item.quantity ? item.quantity.toString() : "0",
          rate: item.rate ? item.rate.toString() : "0.00"
        }))
        await tx.insert(estimateLineItemsTable).values(itemsToInsert)
      }

      const updatedLineItems = await tx.query.estimateLineItems.findMany({
        where: eq(estimateLineItemsTable.estimateId, updateData.estimateId)
      })
      const newTotalAmount = updatedLineItems
        .reduce((sum, item) => sum.plus(new Decimal(item.total ?? 0)), new Decimal(0))
        .toFixed(2)

      await tx
        .update(estimatesTable)
        .set({ totalAmount: newTotalAmount, updatedAt: new Date() })
        .where(eq(estimatesTable.id, updateData.estimateId))
    })

    revalidatePath(`/estimates/${updateData.estimateId}`)
    revalidatePath("/estimates")

    return {
      isSuccess: true,
      message: "Estimate updated successfully",
      data: undefined
    }
  } catch (error: any) {
    console.error("Error updating estimate:", error)
    return {
      isSuccess: false,
      message: `Failed to update estimate: ${error.message}`
    }
  }
}

export async function deleteEstimateAction(
  estimateId: string
): Promise<ActionState<void>> {
  const { userId } = await auth()
  if (!userId) return { isSuccess: false, message: "Unauthorized" }

  try {
    await db
      .delete(estimatesTable)
      .where(and(eq(estimatesTable.id, estimateId), eq(estimatesTable.userId, userId)))

    revalidatePath("/estimates")

    return {
      isSuccess: true,
      message: "Estimate deleted successfully",
      data: undefined
    }
  } catch (error: any) {
    console.error("Error deleting estimate:", error)
    return {
      isSuccess: false,
      message: `Failed to delete estimate: ${error.message}`
    }
  }
}