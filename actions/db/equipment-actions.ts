"use server"

import { db } from "@/db/db"
import {
  InsertEquipment,
  SelectEquipment,
  equipmentTable
} from "@/db/schema/equipment-schema"
import { ActionState } from "@/types"
import { eq } from "drizzle-orm"

/**
 * Creates a new equipment record.
 * @param data - The equipment data to insert.
 * @returns Promise<ActionState<SelectEquipment>> - State object with result.
 */
export async function createEquipmentAction(
  data: Omit<InsertEquipment, "id" | "createdAt" | "updatedAt">
): Promise<ActionState<SelectEquipment>> {
  try {
    const [newItem] = await db.insert(equipmentTable).values(data).returning()
    if (!newItem) {
      throw new Error("Equipment creation failed.")
    }
    return {
      isSuccess: true,
      message: "Equipment created successfully",
      data: newItem
    }
  } catch (error) {
    console.error("Error creating equipment:", error)
    return { isSuccess: false, message: "Failed to create equipment." }
  }
}

/**
 * Retrieves all equipment records.
 * @returns Promise<ActionState<SelectEquipment[]>> - State object with equipment array or error.
 */
export async function getEquipmentAction(): Promise<
  ActionState<SelectEquipment[]>
> {
  try {
    // Consider adding ordering, e.g., .orderBy(equipmentTable.name)
    const items = await db.query.equipment.findMany()
    return {
      isSuccess: true,
      message: "Equipment retrieved successfully",
      data: items
    }
  } catch (error) {
    console.error("Error getting equipment:", error)
    return {
      isSuccess: false,
      message: "Failed to retrieve equipment."
    }
  }
}

/**
 * Updates an existing equipment record by its ID.
 * @param id - The UUID of the equipment to update.
 * @param data - An object containing the fields to update.
 * @returns Promise<ActionState<SelectEquipment>> - State object with the updated equipment or error.
 */
export async function updateEquipmentAction(
  id: string,
  data: Partial<Omit<InsertEquipment, "id" | "createdAt">>
): Promise<ActionState<SelectEquipment>> {
  if (!id) {
    return { isSuccess: false, message: "Equipment ID is required." }
  }
  if (Object.keys(data).length === 0) {
    return { isSuccess: false, message: "No data provided for update." }
  }

  try {
    const [updatedItem] = await db
      .update(equipmentTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(equipmentTable.id, id))
      .returning()

    if (!updatedItem) {
      return { isSuccess: false, message: "Equipment not found to update." }
    }

    return {
      isSuccess: true,
      message: "Equipment updated successfully",
      data: updatedItem
    }
  } catch (error) {
    console.error("Error updating equipment:", error)
    return {
      isSuccess: false,
      message: "Failed to update equipment."
    }
  }
}

/**
 * Deletes an equipment record by its ID.
 * @param id - The UUID of the equipment to delete.
 * @returns Promise<ActionState<void>> - State object indicating success or failure.
 */
export async function deleteEquipmentAction(
  id: string
): Promise<ActionState<void>> {
  if (!id) {
    return { isSuccess: false, message: "Equipment ID is required." }
  }
  try {
    await db.delete(equipmentTable).where(eq(equipmentTable.id, id))

    return {
      isSuccess: true,
      message: "Equipment deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting equipment:", error)
    return {
      isSuccess: false,
      message: "Failed to delete equipment. It might be in use."
    }
  }
} 