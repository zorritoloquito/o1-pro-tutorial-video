"use server"

import { db } from "@/db/db"
import {
  InsertMaterial,
  SelectMaterial,
  materialsTable
} from "@/db/schema/materials-schema"
import { ActionState } from "@/types"
import { and, eq, sql } from "drizzle-orm"

/**
 * Creates a new material record.
 * @param data - The material data to insert.
 * @returns Promise<ActionState<SelectMaterial>> - State object with result.
 */
export async function createMaterialAction(
  data: Omit<InsertMaterial, "id" | "createdAt" | "updatedAt">
): Promise<ActionState<SelectMaterial>> {
  try {
    const [newMaterial] = await db.insert(materialsTable).values(data).returning()
    if (!newMaterial) {
      throw new Error("Material creation failed.")
    }
    return {
      isSuccess: true,
      message: "Material created successfully",
      data: newMaterial
    }
  } catch (error) {
    console.error("Error creating material:", error)
    return { isSuccess: false, message: "Failed to create material." }
  }
}

/**
 * Retrieves all material records.
 * @returns Promise<ActionState<SelectMaterial[]>> - State object with materials array or error.
 */
export async function getMaterialsAction(): Promise<ActionState<SelectMaterial[]>> {
  try {
    // Consider adding ordering, e.g., .orderBy(materialsTable.name)
    const materials = await db.query.materials.findMany()
    return {
      isSuccess: true,
      message: "Materials retrieved successfully",
      data: materials
    }
  } catch (error) {
    console.error("Error getting materials:", error)
    return {
      isSuccess: false,
      message: "Failed to retrieve materials."
    }
  }
}

/**
 * Updates an existing material record by its ID.
 * @param id - The UUID of the material to update.
 * @param data - An object containing the fields to update.
 * @returns Promise<ActionState<SelectMaterial>> - State object with the updated material or error.
 */
export async function updateMaterialAction(
  id: string,
  data: Partial<Omit<InsertMaterial, "id" | "createdAt">>
): Promise<ActionState<SelectMaterial>> {
  if (!id) {
    return { isSuccess: false, message: "Material ID is required." }
  }
  if (Object.keys(data).length === 0) {
    return { isSuccess: false, message: "No data provided for update." }
  }

  try {
    const [updatedMaterial] = await db
      .update(materialsTable)
      .set({ ...data, updatedAt: new Date() }) // Explicitly set updatedAt
      .where(eq(materialsTable.id, id))
      .returning()

    if (!updatedMaterial) {
      return { isSuccess: false, message: "Material not found to update." }
    }

    return {
      isSuccess: true,
      message: "Material updated successfully",
      data: updatedMaterial
    }
  } catch (error) {
    console.error("Error updating material:", error)
    return {
      isSuccess: false,
      message: "Failed to update material."
    }
  }
}

/**
 * Deletes a material record by its ID.
 * @param id - The UUID of the material to delete.
 * @returns Promise<ActionState<void>> - State object indicating success or failure.
 */
export async function deleteMaterialAction(
  id: string
): Promise<ActionState<void>> {
  if (!id) {
    return { isSuccess: false, message: "Material ID is required." }
  }
  try {
    const result = await db.delete(materialsTable).where(eq(materialsTable.id, id))

    // Check if any row was actually deleted if needed (result might vary by driver)
    // pg driver typically doesn't error on 0 rows affected, but might have rowCount

    return {
      isSuccess: true,
      message: "Material deleted successfully",
      data: undefined
    }
  } catch (error) {
    // Catch potential foreign key constraint errors if material is in use
    console.error("Error deleting material:", error)
    // Improve error message based on specific DB error codes if possible
    return {
      isSuccess: false,
      message: "Failed to delete material. It might be in use by an estimate."
    }
  }
} 