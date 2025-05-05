"use server"

import { Suspense } from "react"
import { getEquipmentAction } from "@/actions/db/equipment-actions"
import EquipmentManager from "./_components/equipment-manager"
import { Skeleton } from "@/components/ui/skeleton"

// Reusable skeleton
function DataTableSkeleton() {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-8 w-[120px]" />
      </div>
      <div className="rounded-md border">
        <Skeleton className="h-[400px] w-full" />
      </div>
      <div className="flex items-center justify-end space-x-2">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-8 w-[80px]" />
        <Skeleton className="h-8 w-[80px]" />
      </div>
    </div>
  )
}

async function EquipmentFetcher() {
  const equipmentResult = await getEquipmentAction()

  if (!equipmentResult.isSuccess) {
    return (
      <div className="border-destructive bg-destructive/10 rounded-md border p-4 text-center">
        <p className="text-destructive">{equipmentResult.message}</p>
      </div>
    )
  }

  return <EquipmentManager initialData={equipmentResult.data || []} />
}

export default async function AdminEquipmentPage() {
  return (
    <div className="space-y-6">
      {/* Optional Header */}
      {/*
      <div>
        <h1 className="text-2xl font-bold">Equipment</h1>
        <p className="text-muted-foreground">
          Manage daily rates for equipment rental or usage.
        </p>
      </div>
      */}

      <Suspense fallback={<DataTableSkeleton />}>
        <EquipmentFetcher />
      </Suspense>
    </div>
  )
}
