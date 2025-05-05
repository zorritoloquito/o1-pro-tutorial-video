"use server"

import { db } from "@/db/db"
import {
  InsertLaborRate,
  SelectLaborRate,
  laborRatesTable
} from "@/db/schema/labor-rates-schema"
import { ActionState } from "@/types"
import { eq } from "drizzle-orm"

/**
 * Creates a new labor rate record.
 * @param data - The labor rate data to insert.
 * @returns Promise<ActionState<SelectLaborRate>> - State object with result.
 */
export async function createLaborRateAction(
  data: Omit<InsertLaborRate, "id" | "createdAt" | "updatedAt">
): Promise<ActionState<SelectLaborRate>> {
  try {
    const [newRate] = await db.insert(laborRatesTable).values(data).returning()
    if (!newRate) {
      throw new Error("Labor rate creation failed.")
    }
    return {
      isSuccess: true,
      message: "Labor rate created successfully",
      data: newRate
    }
  } catch (error) {
    console.error("Error creating labor rate:", error)
    return { isSuccess: false, message: "Failed to create labor rate." }
  }
}

/**
 * Retrieves all labor rate records.
 * @returns Promise<ActionState<SelectLaborRate[]>> - State object with rates array or error.
 */
export async function getLaborRatesAction(): Promise<
  ActionState<SelectLaborRate[]>
> {
  try {
    // Consider adding ordering, e.g., .orderBy(laborRatesTable.name)
    const rates = await db.query.laborRates.findMany()
    return {
      isSuccess: true,
      message: "Labor rates retrieved successfully",
      data: rates
    }
  } catch (error) {
    console.error("Error getting labor rates:", error)
    return {
      isSuccess: false,
      message: "Failed to retrieve labor rates."
    }
  }
}

/**
 * Updates an existing labor rate record by its ID.
 * @param id - The UUID of the labor rate to update.
 * @param data - An object containing the fields to update.
 * @returns Promise<ActionState<SelectLaborRate>> - State object with the updated rate or error.
 */
export async function updateLaborRateAction(
  id: string,
  data: Partial<Omit<InsertLaborRate, "id" | "createdAt">>
): Promise<ActionState<SelectLaborRate>> {
  if (!id) {
    return { isSuccess: false, message: "Labor rate ID is required." }
  }
  if (Object.keys(data).length === 0) {
    return { isSuccess: false, message: "No data provided for update." }
  }

  try {
    const [updatedRate] = await db
      .update(laborRatesTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(laborRatesTable.id, id))
      .returning()

    if (!updatedRate) {
      return { isSuccess: false, message: "Labor rate not found to update." }
    }

    return {
      isSuccess: true,
      message: "Labor rate updated successfully",
      data: updatedRate
    }
  } catch (error) {
    console.error("Error updating labor rate:", error)
    return {
      isSuccess: false,
      message: "Failed to update labor rate."
    }
  }
}

/**
 * Deletes a labor rate record by its ID.
 * @param id - The UUID of the labor rate to delete.
 * @returns Promise<ActionState<void>> - State object indicating success or failure.
 */
export async function deleteLaborRateAction(
  id: string
): Promise<ActionState<void>> {
  if (!id) {
    return { isSuccess: false, message: "Labor rate ID is required." }
  }
  try {
    await db.delete(laborRatesTable).where(eq(laborRatesTable.id, id))

    return {
      isSuccess: true,
      message: "Labor rate deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting labor rate:", error)
    return {
      isSuccess: false,
      message: "Failed to delete labor rate. It might be in use."
    }
  }
} 