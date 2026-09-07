import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  serverExternalPackages: ["text2wav"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Permitted-Cross-Domain-Policies",
            value: "none",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.accounts.dev https://clerk.corafric.com https://www.googletagmanager.com https://*.google-analytics.com https://va.vercel-scripts.com https://unpkg.com https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https: https://img.clerk.com https://*.google-analytics.com https://www.googletagmanager.com",
              "font-src 'self' data:",
              "connect-src 'self' https://*.clerk.accounts.dev https://clerk.corafric.com https://*.google-analytics.com https://www.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://*.r2.cloudflarestorage.com https://va.vercel-scripts.com https://unpkg.com https://cdn.jsdelivr.net",
              "media-src 'self' blob: data: https: https://*.r2.cloudflarestorage.com",
              "worker-src 'self' blob:",
              "frame-src 'self' https://*.clerk.accounts.dev https://clerk.corafric.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
      {
        source: "/audios/:path*",
        headers: [
          {
            key: "Content-Type",
            value: "audio/mp4",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
