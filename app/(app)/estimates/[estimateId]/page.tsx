"use server"

import { Suspense } from "react"
import { getEstimateByIdAction } from "@/actions/db/estimates-actions"
import EstimateEditor from "./_components/estimate-editor"
import { EstimateWithDetails } from "@/types" // This type should represent an estimate with its client, site, and lineItems
import { auth } from "@clerk/nextjs/server" // Import auth

interface EstimateDetailPageProps {
  params: {
    estimateId: string
  }
}

// Skeleton for loading state
function EstimateDetailPageSkeleton() {
  return (
    <div className="animate-pulse p-4 md:p-6">
      <div className="mb-6 h-8 w-1/2 rounded bg-gray-300"></div>
      <div className="space-y-4">
        <div className="h-10 w-full rounded bg-gray-200"></div>
        <div className="h-20 w-full rounded bg-gray-200"></div>
        <div className="h-40 w-full rounded bg-gray-200"></div>
        <div className="mt-6 h-10 w-1/4 rounded bg-gray-300"></div>
      </div>
    </div>
  )
}

// Fetcher component for data
async function EstimateDataFetcher({ estimateId }: { estimateId: string }) {
  const { userId } = await auth() // Fetch userId

  if (!userId) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-xl font-semibold text-red-600">Access Denied</h1>
        <p className="text-muted-foreground">
          You must be logged in to view or edit an estimate.
        </p>
      </div>
    )
  }

  const estimateResult = await getEstimateByIdAction(estimateId)

  if (!estimateResult.isSuccess || !estimateResult.data) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-xl font-semibold text-red-600">
          Error Loading Estimate
        </h1>
        <p className="text-muted-foreground">
          {estimateResult.message || "Could not find the requested estimate."}
        </p>
        {/* TODO: Add a link to go back to the estimates list */}
      </div>
    )
  }

  const estimate: EstimateWithDetails = estimateResult.data

  return <EstimateEditor initialEstimate={estimate} userId={userId} /> // Pass userId
}

export default async function EstimateDetailPage({
  params
}: EstimateDetailPageProps) {
  const { estimateId } = params // No need to await params here, it's directly available for page components

  return (
    <div className="p-4 md:p-6">
      <Suspense fallback={<EstimateDetailPageSkeleton />}>
        <EstimateDataFetcher estimateId={estimateId} />
      </Suspense>
    </div>
  )
}
