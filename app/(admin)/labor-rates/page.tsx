"use server"

import { Suspense } from "react"
import { getLaborRatesAction } from "@/actions/db/labor-rates-actions"
import LaborRatesManager from "./_components/labor-rates-manager"
import { Skeleton } from "@/components/ui/skeleton"

// Reusable skeleton (or import if made shared)
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

async function LaborRatesFetcher() {
  const ratesResult = await getLaborRatesAction()

  if (!ratesResult.isSuccess) {
    return (
      <div className="border-destructive bg-destructive/10 rounded-md border p-4 text-center">
        <p className="text-destructive">{ratesResult.message}</p>
      </div>
    )
  }

  return <LaborRatesManager initialData={ratesResult.data || []} />
}

export default async function AdminLaborRatesPage() {
  return (
    <div className="space-y-6">
      {/* Optional Header */}
      {/*
      <div>
        <h1 className="text-2xl font-bold">Labor Rates</h1>
        <p className="text-muted-foreground">
          Manage hourly rates for different labor types.
        </p>
      </div>
      */}

      <Suspense fallback={<DataTableSkeleton />}>
        <LaborRatesFetcher />
      </Suspense>
    </div>
  )
}
