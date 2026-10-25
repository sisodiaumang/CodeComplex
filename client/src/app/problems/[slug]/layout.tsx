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
      title: "Coding Problem Not Found — CodeComplex",
      description: "Explore 400+ algorithmic coding problems and real-time 1v1 duels on CodeComplex.",
    };
  }

  const cleanDescription = (question.statement?.markdown || "")
    .replace(/[#*`_\[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

  const metaDesc = cleanDescription
    ? `${cleanDescription}... Practice ${question.title} in C++, Python, JavaScript, and Java with instant sandbox execution.`
    : `Solve ${question.title} (${question.difficulty} · ${question.category}) on CodeComplex. Test your solution in live Docker containers.`;

  return {
    title: `${question.title} — Practice ${question.difficulty} DSA Challenge`,
    description: metaDesc,
    keywords: [
      question.title,
      `${question.title} problem`,
      `${question.title} solution`,
      `${question.title} leetcode`,
      `${question.title} codecomplex`,
      `practice ${question.title}`,
      `${question.title} python`,
      `${question.title} cpp`,
      `${question.title} javascript`,
      `${question.category.toLowerCase()} dsa problems`,
      `${question.difficulty.toLowerCase()} algorithm challenge`,
      ...(question.tags || []),
    ],
    alternates: {
      canonical: `https://codecomplex.site/problems/${question.slug || slug}`,
    },
    openGraph: {
      title: `${question.title} — ${question.difficulty} Coding Challenge | CodeComplex`,
      description: metaDesc,
      url: `https://codecomplex.site/problems/${question.slug || slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${question.title} — ${question.difficulty} Coding Challenge`,
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
          question.category,
          ...(question.topics || []),
          ...(question.tags || []),
        ],
        "learningResourceType": "Practice Problem",
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
