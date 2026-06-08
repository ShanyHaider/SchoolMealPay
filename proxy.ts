import {
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";

import { NextResponse } from "next/server";

// Public routes

const isPublicRoute = createRouteMatcher([
  "/",
  "/privacy",
  "/terms",
  "/about",
  "/contact",
  "/pricing",
  "/account-error",
  "/forgot-password",
  "/api/webhooks(.*)",
  "/sso-callback(.*)",
]);

// Auth pages

const isAuthRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(
  async (auth, request) => {
    const { userId } = await auth();

    // ─────────────────────────────────────────
    // Prevent signed-in users from visiting
    // auth pages
    // ─────────────────────────────────────────

    if (isAuthRoute(request) && userId) {
      return NextResponse.redirect(
        new URL("/dashboard", request.url)
      );
    }

    // ─────────────────────────────────────────
    // Protect everything else
    // except public routes
    // ─────────────────────────────────────────

    if (
      !isPublicRoute(request) &&
      !isAuthRoute(request)
    ) {
      await auth.protect();
    }
  }
);

export const config = {
  matcher: [
    /*
     * Skip:
     * - _next
     * - static files
     * - images
     */

    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",

    // Always run for APIs

    "/(api|trpc)(.*)",
  ],
};