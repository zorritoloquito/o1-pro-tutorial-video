"use server"

import { db } from "@/db/db"
import {
  InsertSetting,
  SelectSetting,
  settingsTable
} from "@/db/schema/settings-schema"
import { ActionState } from "@/types"
import { eq } from "drizzle-orm"

/**
 * Retrieves the first settings record found in the database.
 * Assumes a single-row settings configuration.
 * @returns Promise<ActionState<SelectSetting>> - State object with settings data or error.
 */
export async function getSettingsAction(): Promise<ActionState<SelectSetting>> {
  try {
    // Fetch the first settings record. Add ordering if multiple might exist and one is preferred.
    const settings = await db.query.settings.findFirst()

    if (!settings) {
      // If no settings found, return success=false. Consider creating default settings here if needed.
      // For now, aligns with user instruction to manually insert first row.
      return { isSuccess: false, message: "No settings found." }
    }

    return {
      isSuccess: true,
      message: "Settings retrieved successfully",
      data: settings
    }
  } catch (error) {
    console.error("Error getting settings:", error)
    return {
      isSuccess: false,
      message: "Failed to retrieve settings due to a server error."
    }
  }
}

/**
 * Updates an existing settings record identified by its ID.
 * @param id - The ID of the settings record to update.
 * @param data - An object containing the fields to update. Excludes 'id' and 'createdAt'.
 * @returns Promise<ActionState<SelectSetting>> - State object with the updated settings or error.
 */
export async function updateSettingsAction(
  id: number,
  data: Partial<Omit<InsertSetting, "id" | "createdAt">>
): Promise<ActionState<SelectSetting>> {
  if (!id) {
    return { isSuccess: false, message: "Settings ID is required for update." }
  }
  if (Object.keys(data).length === 0) {
    return { isSuccess: false, message: "No data provided for update." }
  }

  try {
    // Ensure updatedAt is handled automatically by the database $onUpdate trigger
    // or explicitly set here if the trigger isn't reliable across all updates.
    const [updatedSettings] = await db
      .update(settingsTable)
      .set({ ...data, updatedAt: new Date() }) // Explicitly setting for safety
      .where(eq(settingsTable.id, id))
      .returning()

    if (!updatedSettings) {
      return { isSuccess: false, message: "Settings record not found to update." }
    }

    return {
      isSuccess: true,
      message: "Settings updated successfully",
      data: updatedSettings
    }
  } catch (error) {
    console.error("Error updating settings:", error)
    return {
      isSuccess: false,
      message: "Failed to update settings due to a server error."
    }
  }
}

// Optional: createSettingsAction if needed, but manual insert is the current instruction.
/*
export async function createSettingsAction(
  data: Omit<InsertSetting, "id" | "createdAt" | "updatedAt"> // Ensure required fields are provided
): Promise<ActionState<SelectSetting>> {
  try {
    const [newSettings] = await db.insert(settingsTable).values(data).returning();
    return { isSuccess: true, message: "Settings created successfully", data: newSettings };
  } catch (error) {
    console.error("Error creating settings:", error);
    // Handle specific errors like unique constraint violations if applicable
    return { isSuccess: false, message: "Failed to create settings." };
  }
}
*/ 