import { getAllQuestions } from "@/lib/questions";
import { ProblemsClientCatalog } from "./ProblemsClientCatalog";

export default async function ProblemsCatalogPage() {
  const problems = await getAllQuestions();
  return <ProblemsClientCatalog initialProblems={problems} />;
}
