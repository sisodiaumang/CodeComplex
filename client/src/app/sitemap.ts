import { MetadataRoute } from "next";
import questionsManifest from "@/data/questions-manifest.json";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://codecomplex.site";
  const now = new Date();

  const coreRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/problems`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/battle`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/verify-certificate`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/revision`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/achievements`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${baseUrl}/matches`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/guidelines`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/auth.md`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const questionRoutes: MetadataRoute.Sitemap = (questionsManifest as Array<{ slug: string; difficulty: string }>).map((q) => ({
    url: `${baseUrl}/problems/${q.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: q.difficulty === "Easy" ? 0.85 : q.difficulty === "Medium" ? 0.8 : 0.75,
  }));

  return [...coreRoutes, ...questionRoutes];
}
