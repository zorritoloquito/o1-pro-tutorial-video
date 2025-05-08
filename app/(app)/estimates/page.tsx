"use server"

import { Suspense } from "react"
import Link from "next/link"
import { getEstimatesByUserIdAction } from "@/actions/db/estimates-actions"
import EstimatesListTable from "./_components/estimates-list-table"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { SelectEstimate } from "@/db/schema" // Assuming this type includes necessary details or we use a more specific one like EstimateWithDetails

// Skeleton for loading state
function EstimatesPageSkeleton() {
  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Estimates</h1>
        <div className="h-10 w-40 animate-pulse rounded bg-gray-300"></div>
      </div>
      <div className="animate-pulse rounded-md border">
        <div className="h-12 rounded-t-md bg-gray-200"></div>{" "}
        {/* Table Header */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center border-b p-4">
            <div className="mr-4 h-6 w-1/4 rounded bg-gray-200"></div>
            <div className="mr-4 h-6 w-1/4 rounded bg-gray-200"></div>
            <div className="mr-4 h-6 w-1/4 rounded bg-gray-200"></div>
            <div className="h-6 w-1/4 rounded bg-gray-200"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Fetcher component for data
async function EstimatesDataFetcher() {
  // For now, fetch first page, 10 items. Pagination can be added later.
  const estimatesResult = await getEstimatesByUserIdAction(10, 1)

  if (!estimatesResult.isSuccess) {
    return (
      <div className="p-4 text-red-500 md:p-6">
        <h1 className="mb-4 text-2xl font-semibold">My Estimates</h1>
        <p>Error: {estimatesResult.message || "Could not load estimates."}</p>
      </div>
    )
  }

  // The getEstimatesByUserIdAction returns data: { estimates: SelectEstimate[], totalCount: number }
  // The SelectEstimate in estimates-actions.ts is augmented with client and site:
  // with: { client: true, site: true }
  // So the type passed to EstimatesListTable should reflect this.
  // Let's define a more specific type or ensure EstimatesListTable expects this structure.
  // For now, we assume `estimatesResult.data.estimates` is the correct array to pass.

  const estimates = estimatesResult.data?.estimates || []
  const totalCount = estimatesResult.data?.totalCount || 0

  return (
    <EstimatesListTable
      estimates={estimates}
      totalCount={totalCount}
      // We might need to pass currentPage and itemsPerPage if we implement pagination in the table
    />
  )
}

export default async function EstimatesPage() {
  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Estimates</h1>
        <Button asChild>
          <Link href="/estimates/create">
            <PlusCircle className="mr-2 size-4" /> Create New Estimate
          </Link>
        </Button>
      </div>
      <Suspense fallback={<EstimatesPageSkeleton />}>
        <EstimatesDataFetcher />
      </Suspense>
    </div>
  )
}
