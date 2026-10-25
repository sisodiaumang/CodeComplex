import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/battle", "/leaderboard", "/about", "/faq", "/verify-certificate", "/revision", "/achievements"],
      disallow: ["/admin/", "/settings/", "/notifications/", "/battle/"],
    },
    sitemap: "https://codecomplex.site/sitemap.xml",
  };
}
