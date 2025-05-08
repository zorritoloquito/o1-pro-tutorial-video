"use server"

import { db } from "@/db/db"
import {
  clientsTable,
  InsertClient,
  SelectClient
} from "@/db/schema/clients-schema"
import { ActionState } from "@/types"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function createClientAction(
  clientData: InsertClient
): Promise<ActionState<SelectClient>> {
  try {
    const [newClient] = await db
      .insert(clientsTable)
      .values(clientData)
      .returning()

    revalidatePath("/admin/clients") // Assuming an admin page for clients
    revalidatePath("/estimates/create") // Revalidate estimate creation page as it might list clients

    return {
      isSuccess: true,
      message: "Client created successfully",
      data: newClient
    }
  } catch (error: any) {
    console.error("Error creating client:", error)
    return { isSuccess: false, message: `Failed to create client: ${error.message}` }
  }
}

export async function getClientsAction(): Promise<
  ActionState<SelectClient[]>
> {
  try {
    const clients = await db.query.clients.findMany({
      orderBy: (clients, { asc }) => [asc(clients.name)] // Order by name for better UX in dropdowns
    })
    return {
      isSuccess: true,
      message: "Clients retrieved successfully",
      data: clients
    }
  } catch (error: any) {
    console.error("Error getting clients:", error)
    return {
      isSuccess: false,
      message: `Failed to get clients: ${error.message}`
    }
  }
}

export async function getClientByIdAction(
  clientId: string
): Promise<ActionState<SelectClient>> {
  try {
    const client = await db.query.clients.findFirst({
      where: eq(clientsTable.id, clientId)
    })

    if (!client) {
      return { isSuccess: false, message: "Client not found" }
    }

    return {
      isSuccess: true,
      message: "Client retrieved successfully",
      data: client
    }
  } catch (error: any) {
    console.error("Error getting client by ID:", error)
    return {
      isSuccess: false,
      message: `Failed to get client: ${error.message}`
    }
  }
}

export async function updateClientAction(
  clientId: string,
  clientData: Partial<Omit<InsertClient, "id">>
): Promise<ActionState<SelectClient>> {
  try {
    const [updatedClient] = await db
      .update(clientsTable)
      .set(clientData)
      .where(eq(clientsTable.id, clientId))
      .returning()

    if (!updatedClient) {
      return { isSuccess: false, message: "Client not found or failed to update" }
    }

    revalidatePath("/admin/clients")
    revalidatePath(`/admin/clients/${clientId}`)
    revalidatePath("/estimates/create")

    return {
      isSuccess: true,
      message: "Client updated successfully",
      data: updatedClient
    }
  } catch (error: any) {
    console.error("Error updating client:", error)
    return {
      isSuccess: false,
      message: `Failed to update client: ${error.message}`
    }
  }
}

export async function deleteClientAction(
  clientId: string
): Promise<ActionState<void>> {
  try {
    const result = await db
      .delete(clientsTable)
      .where(eq(clientsTable.id, clientId))
      .returning({ id: clientsTable.id })

    if (result.length === 0) {
      return { isSuccess: false, message: "Client not found or already deleted" }
    }

    revalidatePath("/admin/clients")
    revalidatePath("/estimates/create")

    return {
      isSuccess: true,
      message: "Client deleted successfully",
      data: undefined
    }
  } catch (error: any) {
    console.error("Error deleting client:", error)
    return {
      isSuccess: false,
      message: `Failed to delete client: ${error.message}`
    }
  }
} 