import { redirect } from "next/navigation";

export default async function CertificateParamRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const id = resolvedParams?.id || "";
  redirect(`/verify-certificate?id=${encodeURIComponent(id)}`);
}
