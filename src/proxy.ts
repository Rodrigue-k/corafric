import createMiddleware from "next-intl/middleware";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { locales, defaultLocale } from "./i18n/config";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

const isProtectedRoute = createRouteMatcher([
  "/:locale/contribute(.*)",
  "/:locale/validate(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  // Bypass next-intl locale redirects/rewrites for API endpoints so Clerk can run on them
  if (req.nextUrl.pathname.startsWith("/api")) {
    return;
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: [
    // Match dynamic page segment routes, excluding static assets
    "/((?!_next|[^?]*\\.(?:html|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always trigger Clerk auth on API routes
    "/(api|trpc)(.*)",
  ],
};
