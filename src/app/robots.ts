import type { MetadataRoute } from "next";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://localhub.co.za";
}

export default function robots(): MetadataRoute.Robots {
  const root = siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/listing/", "/api/listings/"],
        disallow: ["/api/internal/", "/api/vendor/", "/(dashboard)/"],
        crawlDelay: 1,
      },
    ],
    sitemap: `${root}/sitemap.xml`,
    host: root,
  };
}
