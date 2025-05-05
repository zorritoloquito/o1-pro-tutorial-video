"use server"

import { Suspense } from "react"
import SettingsForm from "./_components/settings-form"
import { getSettingsAction } from "@/actions/db/settings-actions"
import { Skeleton } from "@/components/ui/skeleton"

// Skeleton component for loading state
function SettingsFormSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-[300px]" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-[300px]" />
      </div>
      {/* Add skeletons for other fields as needed */}
      <Skeleton className="h-10 w-[120px]" />
    </div>
  )
}

// Async component to fetch data
async function SettingsFetcher() {
  const settingsResult = await getSettingsAction()

  if (!settingsResult.isSuccess || !settingsResult.data) {
    // Handle case where settings don't exist yet
    // Corresponds to the user instruction: "Manually insert a default row..."
    return (
      <div className="rounded-md border border-dashed p-6 text-center">
        <p className="text-muted-foreground">
          No application settings found in the database.
        </p>
        <p className="text-muted-foreground mt-2 text-sm">
          Please manually insert a default settings row via the Supabase SQL
          editor or Studio, then refresh this page.
        </p>
        {/* Optionally, provide a button to create default settings if a create action exists */}
      </div>
    )
  }

  return <SettingsForm initialData={settingsResult.data} />
}

// Main page component
export default async function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Application Settings</h1>
        <p className="text-muted-foreground">
          Manage your company details and application configurations.
        </p>
      </div>

      {/* Use Suspense to handle loading state */}
      <Suspense fallback={<SettingsFormSkeleton />}>
        <SettingsFetcher />
      </Suspense>
    </div>
  )
}
