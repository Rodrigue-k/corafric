import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/api/*"],
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/", "/favicon*", "/icon*", "/images/*"],
      },
    ],
    sitemap: "https://corafric.com/sitemap.xml",
  };
}
