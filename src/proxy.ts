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
  "/:locale/admin(.*)",
  "/:locale/studio(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  // Bypass next-intl locale redirects/rewrites for API endpoints and static metadata files
  if (
    req.nextUrl.pathname.startsWith("/api") ||
    req.nextUrl.pathname === "/manifest.json" ||
    req.nextUrl.pathname === "/robots.txt" ||
    req.nextUrl.pathname === "/sitemap.xml" ||
    req.nextUrl.pathname === "/favicon.ico"
  ) {
    return;
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: [
    // Match dynamic page segment routes, excluding static assets
    "/((?!_next|[^?]*\\.(?:html|css|js|json|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp4|mp3|wav|ogg|m4a|webm|flac|aac)).*)",
    // Always trigger Clerk auth on API routes
    "/(api|trpc)(.*)",
  ],
};
