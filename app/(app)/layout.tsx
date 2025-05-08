"use server"

import { UserButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { Toaster } from "sonner"

export default async function AppLayout({
  children
}: {
  children: React.ReactNode
}) {
  // Fetch user-specific data or perform other server-side logic if needed
  const { userId } = await auth()

  return (
    <div className="min-h-screen">
      <header className="bg-background flex h-16 items-center justify-between border-b px-4 md:px-6">
        <div>{/* Placeholder for logo or nav */}</div>
        <div>
          {userId && <UserButton afterSignOutUrl="/" />}{" "}
          {/* Show UserButton if logged in */}
        </div>
      </header>

      <main className="p-4 md:p-6">{children}</main>

      {/* Optional Footer */}
      {/* <footer className="border-t p-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Your Company
      </footer> */}
      <Toaster richColors position="top-right" />
    </div>
  )
}
