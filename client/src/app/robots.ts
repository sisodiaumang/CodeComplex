import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/battle",
        "/leaderboard",
        "/about",
        "/faq",
        "/verify-certificate",
        "/revision",
        "/achievements",
        "/matches",
        "/login",
        "/signup",
        "/contact",
        "/guidelines",
        "/privacy",
        "/terms",
      ],
      disallow: [
        "/admin",
        "/admin/",
        "/settings",
        "/settings/",
        "/notifications",
        "/notifications/",
        "/dashboard",
        "/dashboard/",
        "/friends",
        "/friends/",
        "/battle/",
      ],
    },
    sitemap: "https://codecomplex.site/sitemap.xml",
  };
}
