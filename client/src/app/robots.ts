import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/problems",
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
        "/api/",
        "/dashboard",
        "/dashboard/",
      ],
    },
    sitemap: "https://codecomplex.site/sitemap.xml",
  };
}
