import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/settings/", "/notifications/", "/battle/"],
    },
    sitemap: "https://codecomplex.work.gd/sitemap.xml",
  };
}
