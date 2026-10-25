import { MetadataRoute } from "next";
import { getAllQuestionsSummary } from "@/lib/questions";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  try {
    const questions = await getAllQuestionsSummary();
    const questionRoutes: MetadataRoute.Sitemap = questions.map((q) => ({
      url: `${baseUrl}/problems/${q.slug || q._id}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: q.difficulty === "Easy" ? 0.85 : q.difficulty === "Medium" ? 0.8 : 0.75,
    }));

    return [...coreRoutes, ...questionRoutes];
  } catch (err) {
    console.error("Failed to generate dynamic question sitemap:", err);
    return coreRoutes;
  }
}
