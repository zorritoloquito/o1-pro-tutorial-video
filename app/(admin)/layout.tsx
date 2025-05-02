"use server"

import { getProfileByUserIdAction } from "@/actions/db/profiles-actions"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    // Should be handled by Clerk middleware, but as a safeguard
    redirect("/sign-in")
  }

  const profileResult = await getProfileByUserIdAction(userId)

  if (!profileResult.isSuccess || !profileResult.data?.isAdmin) {
    // If profile fetch fails or user is not admin, redirect to app dashboard
    console.warn(
      `Admin access denied for user ${userId}. Reason: ${!profileResult.isSuccess ? profileResult.message : "Not an admin"}. Redirecting to /dashboard.`
    )
    redirect("/dashboard")
  }

  // User is authenticated and is an admin
  return <>{children}</>
}
