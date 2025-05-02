/**
 * @description
 * Contains server actions for CRUD (Create, Read, Update, Delete) operations
 * on the `profiles` table in the database. Handles user profile data,
 * including application-specific fields like `isAdmin` and QBO tokens.
 *
 * @dependencies
 * - @/db/db: Drizzle client instance.
 * - @/db/schema: Profile schema definitions (`profilesTable`, `InsertProfile`, `SelectProfile`).
 * - @/types: Shared types, including `ActionState`.
 * - drizzle-orm: Used for database query operations (e.g., `eq`).
 *
 * @actions
 * - createProfileAction: Creates a new user profile record.
 * - getProfileByUserIdAction: Retrieves a profile based on the user's ID (Clerk ID).
 * - updateProfileAction: Updates an existing profile based on the user's ID.
 * - updateProfileByStripeCustomerIdAction: Updates profile based on Stripe ID (template legacy, unused).
 * - deleteProfileAction: Deletes a profile based on the user's ID.
 *
 * @notes
 * - Actions return a standardized `ActionState` object indicating success/failure and data/message.
 * - Error handling includes logging errors to the console and returning a failure state.
 * - QBO token encryption/decryption logic will need to be added here or in calling actions when implementing QBO features.
 */

"use server"

import { db } from "@/db/db"
import {
  InsertProfile,
  profilesTable,
  SelectProfile
} from "@/db/schema/profiles-schema"
import { ActionState } from "@/types"
import { eq } from "drizzle-orm"

/**
 * Creates a new profile record in the database.
 * Typically called after a new user signs up via Clerk.
 * Ensures the `isAdmin` field defaults to false unless specified.
 * @param data - The profile data to insert, requiring at least `userId`.
 * @returns Promise<ActionState<SelectProfile>> - State object with result.
 */
export async function createProfileAction(
  data: InsertProfile // Requires userId, other fields are optional or have defaults
): Promise<ActionState<SelectProfile>> {
  try {
    // Ensure isAdmin defaults to false if not provided, respecting schema default
    const profileData = {
      ...data,
      isAdmin: data.isAdmin ?? false // Explicitly set default if needed, though schema handles it
    }
    const [newProfile] = await db
      .insert(profilesTable)
      .values(profileData)
      .returning()

    if (!newProfile) {
      // This case might indicate an issue with the insert or returning clause
      throw new Error("Profile creation did not return a result.")
    }

    return {
      isSuccess: true,
      message: "Profile created successfully",
      data: newProfile
    }
  } catch (error) {
    console.error("Error creating profile:", error)
    // Provide a more specific message if possible (e.g., duplicate user ID)
    return {
      isSuccess: false,
      message: "Failed to create profile. Please try again later."
    }
  }
}

/**
 * Retrieves a user profile by their Clerk User ID.
 * @param userId - The Clerk User ID of the profile to retrieve.
 * @returns Promise<ActionState<SelectProfile>> - State object with result or error.
 */
export async function getProfileByUserIdAction(
  userId: string
): Promise<ActionState<SelectProfile>> {
  if (!userId) {
    return { isSuccess: false, message: "User ID is required." }
  }
  try {
    const profile = await db.query.profiles.findFirst({
      where: eq(profilesTable.userId, userId)
    })

    if (!profile) {
      return { isSuccess: false, message: "Profile not found." }
    }

    return {
      isSuccess: true,
      message: "Profile retrieved successfully",
      data: profile
    }
  } catch (error) {
    console.error("Error getting profile by user id:", error)
    return {
      isSuccess: false,
      message: "Failed to retrieve profile due to a server error."
    }
  }
}

/**
 * Updates an existing user profile identified by Clerk User ID.
 * Handles partial updates, only changing fields provided in the `data` object.
 * Note: Sensitive fields like QBO tokens should be encrypted *before* calling this action.
 * @param userId - The Clerk User ID of the profile to update.
 * @param data - An object containing the fields to update.
 * @returns Promise<ActionState<SelectProfile>> - State object with the updated profile or error.
 */
export async function updateProfileAction(
  userId: string,
  data: Partial<Omit<InsertProfile, "userId" | "createdAt">> // Allow updating any field except userId and createdAt
): Promise<ActionState<SelectProfile>> {
  if (!userId) {
    return { isSuccess: false, message: "User ID is required for update." }
  }
  if (Object.keys(data).length === 0) {
    return { isSuccess: false, message: "No data provided for update." }
  }

  try {
    // Ensure updatedAt is handled automatically by the database $onUpdate trigger
    const [updatedProfile] = await db
      .update(profilesTable)
      .set({ ...data, updatedAt: new Date() }) // Explicitly setting updatedAt can bypass $onUpdate in some setups, ensure DB handles it primarily. Schema definition is preferred.
      .where(eq(profilesTable.userId, userId))
      .returning()

    if (!updatedProfile) {
      return { isSuccess: false, message: "Profile not found to update." }
    }

    return {
      isSuccess: true,
      message: "Profile updated successfully",
      data: updatedProfile
    }
  } catch (error) {
    console.error("Error updating profile:", error)
    return {
      isSuccess: false,
      message: "Failed to update profile due to a server error."
    }
  }
}

/**
 * Updates a profile based on the Stripe Customer ID.
 * Kept for template consistency, but not actively used in Belknap features.
 * @param stripeCustomerId - The Stripe Customer ID to match.
 * @param data - The profile data fields to update.
 * @returns Promise<ActionState<SelectProfile>> - State object with result.
 */
export async function updateProfileByStripeCustomerIdAction(
  stripeCustomerId: string,
  data: Partial<InsertProfile>
): Promise<ActionState<SelectProfile>> {
  if (!stripeCustomerId) {
    return {
      isSuccess: false,
      message: "Stripe Customer ID is required for update."
    }
  }
  try {
    const [updatedProfile] = await db
      .update(profilesTable)
      .set(data)
      .where(eq(profilesTable.stripeCustomerId, stripeCustomerId))
      .returning()

    if (!updatedProfile) {
      return {
        isSuccess: false,
        message: "Profile not found by Stripe customer ID."
      }
    }

    return {
      isSuccess: true,
      message: "Profile updated by Stripe customer ID successfully",
      data: updatedProfile
    }
  } catch (error) {
    console.error("Error updating profile by stripe customer ID:", error)
    return {
      isSuccess: false,
      message: "Failed to update profile by Stripe customer ID."
    }
  }
}

/**
 * Deletes a user profile identified by Clerk User ID.
 * Use with caution, as this may orphan related data if cascading deletes are not set up properly elsewhere.
 * @param userId - The Clerk User ID of the profile to delete.
 * @returns Promise<ActionState<void>> - State object indicating success or failure.
 */
export async function deleteProfileAction(
  userId: string
): Promise<ActionState<void>> {
  if (!userId) {
    return { isSuccess: false, message: "User ID is required for deletion." }
  }
  try {
    const result = await db
      .delete(profilesTable)
      .where(eq(profilesTable.userId, userId))

    // Drizzle delete doesn't throw error if no rows match, check result if needed
    // Assuming success if no error is thrown. Add row count check if necessary.
    // if (result.rowCount === 0) {
    //   return { isSuccess: false, message: "Profile not found to delete." };
    // }

    return {
      isSuccess: true,
      message: "Profile deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting profile:", error)
    return {
      isSuccess: false,
      message: "Failed to delete profile due to a server error."
    }
  }
}