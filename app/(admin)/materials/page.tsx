"use server"

import { Suspense } from "react"
import { getMaterialsAction } from "@/actions/db/materials-actions"
import MaterialsManager from "./_components/materials-manager"
import { Skeleton } from "@/components/ui/skeleton"

// Skeleton for the data table loading state
function MaterialsTableSkeleton() {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-1/4" /> {/* Filter input skeleton */}
        <Skeleton className="h-8 w-[120px]" /> {/* Columns button skeleton */}
      </div>
      <div className="rounded-md border">
        <Skeleton className="h-[400px] w-full" /> {/* Table body skeleton */}
      </div>
      <div className="flex items-center justify-end space-x-2">
        <Skeleton className="h-8 w-1/4" /> {/* Row count skeleton */}
        <Skeleton className="h-8 w-[80px]" /> {/* Prev button skeleton */}
        <Skeleton className="h-8 w-[80px]" /> {/* Next button skeleton */}
      </div>
    </div>
  )
}

// Async component to fetch data
async function MaterialsFetcher() {
  const materialsResult = await getMaterialsAction()

  // Handle potential error during fetch, though the manager component might also handle empty data
  if (!materialsResult.isSuccess) {
    return (
      <div className="border-destructive bg-destructive/10 rounded-md border p-4 text-center">
        <p className="text-destructive">{materialsResult.message}</p>
      </div>
    )
  }

  return <MaterialsManager initialData={materialsResult.data || []} />
}

// Main page component
export default async function AdminMaterialsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header can be added here if desired */}
      {/*
      <div>
        <h1 className="text-2xl font-bold">Materials</h1>
        <p className="text-muted-foreground">
          Manage material costs and units for estimates.
        </p>
      </div>
      */}

      <Suspense fallback={<MaterialsTableSkeleton />}>
        <MaterialsFetcher />
      </Suspense>
    </div>
  )
}
