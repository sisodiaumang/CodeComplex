import type { Metadata } from "next";
import { getQuestionBySlug } from "@/lib/questions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const question = await getQuestionBySlug(slug);

  if (!question) {
    return {
      title: "Challenge Not Found — CodeComplex",
      description: "Explore 4,000+ coding challenges across algorithms, debugging, frontend, backend, and prompt engineering on CodeComplex.",
    };
  }

  const cleanDescription = (question.statement?.markdown || "")
    .replace(/[#*`_\[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

  const modeLabels: Record<string, string> = {
    DSA: "DSA Algorithm",
    BUG_FIX: "Bug Fix & Debugging",
    FRONTEND: "Frontend UI",
    BACKEND: "Backend API",
    PROMPT_WAR: "AI Prompt War",
  };
  const modeLabel = modeLabels[question.mode?.toUpperCase() || "DSA"] || "Coding";

  const metaDesc = cleanDescription
    ? `${cleanDescription}... Practice this ${question.difficulty} ${modeLabel} challenge in CodeComplex's real-time Docker sandbox.`
    : `Solve ${question.title} (${question.difficulty} · ${modeLabel}) on CodeComplex. Test your code in live sandboxes with instant execution.`;

  return {
    title: `${question.title} — ${modeLabel} (${question.difficulty})`,
    description: metaDesc,
    keywords: [
      question.title,
      `${question.title} challenge`,
      `${question.title} solution`,
      `${question.title} practice`,
      `${modeLabel.toLowerCase()} challenge`,
      `${question.difficulty.toLowerCase()} coding question`,
      question.category.toLowerCase(),
      ...(question.tags || []),
      ...(question.topics || []),
    ],
    alternates: {
      canonical: `https://codecomplex.site/problems/${question.slug || slug}`,
    },
    openGraph: {
      title: `${question.title} — ${modeLabel} (${question.difficulty}) | CodeComplex`,
      description: metaDesc,
      url: `https://codecomplex.site/problems/${question.slug || slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${question.title} — ${modeLabel} (${question.difficulty})`,
      description: metaDesc,
    },
  };
}

export default async function ProblemDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const question = await getQuestionBySlug(slug);

  const questionSchema = question
    ? {
        "@context": "https://schema.org",
        "@type": "Question",
        "name": question.title,
        "text": question.statement?.markdown || question.title,
        "educationalLevel": question.difficulty,
        "about": [
          question.mode,
          question.category,
          ...(question.topics || []),
          ...(question.tags || []),
        ],
        "learningResourceType": "Interactive Challenge",
        "potentialAction": {
          "@type": "SolveAction",
          "target": `https://codecomplex.site/problems/${question.slug || slug}`,
        },
      }
    : null;

  return (
    <>
      {questionSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(questionSchema) }}
        />
      )}
      {children}
    </>
  );
}
