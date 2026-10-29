import { notFound } from "next/navigation";
import { getQuestionBySlug } from "@/lib/questions";
import { ProblemClientEditor } from "./ProblemClientEditor";

export default async function ProblemDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const question = await getQuestionBySlug(slug);

  if (!question) {
    notFound();
  }

  return <ProblemClientEditor initialQuestion={question} slug={slug} />;
}
