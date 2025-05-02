/**
 * @description
 * Contains Clerk middleware for protecting application routes.
 * It checks user authentication status and redirects unauthenticated users
 * trying to access protected areas.
 *
 * @dependencies
 * - @clerk/nextjs/server: Provides `clerkMiddleware` and `createRouteMatcher`.
 * - next/server: Provides `NextResponse` for controlling request flow.
 *
 * @configuration
 * - `isProtectedRoute`: Defines which route patterns require authentication.
 * - `clerkMiddleware`: Wraps the authentication logic.
 * - `config.matcher`: Specifies which paths the middleware should run on.
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

// Define protected routes: includes the main app area and the admin area.
const isProtectedRoute = createRouteMatcher([
  "/app/(.*)", // Matches all routes under /app (e.g., /app/estimates, /app/dashboard)
  "/admin/(.*)" // Matches all routes under /admin (e.g., /admin/settings, /admin/materials)
])

// Define public routes (optional, Clerk defaults to protecting everything not explicitly public)
// const isPublicRoute = createRouteMatcher(['/']); // Example: Make landing page public

export default clerkMiddleware(async (auth, req) => {
  // If route is protected, check for authentication
  if (isProtectedRoute(req)) {
    const session = await auth()
    if (!session.userId) {
      return session.redirectToSignIn({ returnBackUrl: req.url })
    }
  }

  // Allow the request to proceed if authenticated or if the route is not protected
  return NextResponse.next()
})

export const config = {
  // The following matcher runs middleware on all routes
  // except static files and _next paths, but allows API routes.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"]
}