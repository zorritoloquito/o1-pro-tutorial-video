"use server"

import { Suspense } from "react"
import { getClientsAction } from "@/actions/db/clients-actions"
import EstimateForm from "./_components/estimate-form"
import { SelectClient } from "@/db/schema"
import { auth } from "@clerk/nextjs/server"

// Define a simple skeleton for loading state
function CreateEstimatePageSkeleton() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-2xl font-semibold">Create New Estimate</h1>
      <div className="animate-pulse">
        <div className="mb-4 h-8 w-1/4 rounded bg-gray-200"></div>
        <div className="space-y-4">
          <div className="h-10 rounded bg-gray-200"></div>
          <div className="h-10 w-3/4 rounded bg-gray-200"></div>
          <div className="h-10 w-1/2 rounded bg-gray-200"></div>
          <div className="mt-6 h-12 w-1/4 rounded bg-gray-300"></div>
        </div>
      </div>
    </div>
  )
}

// Fetcher component to handle data fetching inside Suspense
async function EstimateFormDataFetcher() {
  const clientsResult = await getClientsAction()
  const { userId } = await auth()

  if (!userId) {
    return (
      <div className="p-4 text-red-600 md:p-6">
        <h1 className="mb-4 text-2xl font-semibold">Access Denied</h1>
        <p>You must be logged in to create an estimate.</p>
      </div>
    )
  }

  if (!clientsResult.isSuccess || !clientsResult.data) {
    return (
      <div className="p-4 text-red-600 md:p-6">
        <h1 className="mb-4 text-2xl font-semibold">Create New Estimate</h1>
        <p>Error: {clientsResult.message || "Could not load client data."}</p>
        <p>Please ensure there are clients in the system or try again later.</p>
      </div>
    )
  }

  // Ensure clientsResult.data is not undefined before passing
  const clients: SelectClient[] = clientsResult.data || []

  return <EstimateForm clients={clients} userId={userId} />
}

export default async function CreateEstimatePage() {
  return (
    <Suspense fallback={<CreateEstimatePageSkeleton />}>
      <EstimateFormDataFetcher />
    </Suspense>
  )
}
