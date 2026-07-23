import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/settings/", "/notifications/", "/battle/"],
    },
    sitemap: "https://codecomplex.site/sitemap.xml",
  };
}
