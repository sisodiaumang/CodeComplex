"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  Copy,
  Check,
  Printer,
  RotateCcw,
  ExternalLink,
  Award,
  Calendar,
  User,
  Cpu,
  Layers,
  FileCheck,
  ArrowLeft,
  Building2,
  AlertCircle
} from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import type { InternshipCertificate, CertificateVerifyResponse } from "@/lib/types";
import { LogoMark } from "@/components/logo";
import { useAuth } from "@/stores/auth-store";
import { Avatar } from "@/components/ui";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PublicNavbar } from "@/components/PublicNavbar";

const SAMPLE_IDS = [
  { id: "CC-INT-2026-001", label: "Full Stack (Summer '26)" },
  { id: "CC-INT-2026-002", label: "Backend Systems" },
  { id: "CC-INT-2026-003", label: "Frontend Architecture" },
  { id: "CC-INT-2026-9479", label: "AI & ML (Suraj Saw)" },
];

function CertificateVerifierContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, status } = useAuth();
  const isAuthenticated = status === "authed" && !!user;
  const initialId = searchParams.get("id") || "";

  const [searchId, setSearchId] = useState(initialId);
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState<InternshipCertificate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchedCode, setSearchedCode] = useState("");

  const executeVerify = async (codeToVerify: string) => {
    const trimmed = codeToVerify.trim().toUpperCase();
    if (!trimmed) {
      setError("Please enter a Certificate Verification ID");
      setCertificate(null);
      return;
    }

    setLoading(true);
    setError(null);
    setSearchedCode(trimmed);

    try {
      const res = await api<CertificateVerifyResponse>(
        `/certificates/verify/${encodeURIComponent(trimmed)}`
      );

      if (res && res.certificate) {
        setCertificate(res.certificate);
        // Sync URL query param without full reload
        router.replace(`/verify-certificate?id=${encodeURIComponent(trimmed)}`, { scroll: false });
      } else {
        throw new Error("Invalid response from certification registry.");
      }
    } catch (err: unknown) {
      setCertificate(null);
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialId) {
      setSearchId(initialId);
      executeVerify(initialId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeVerify(searchId);
  };

  const copyVerificationLink = () => {
    if (!certificate) return;
    const url = `https://codecomplex.site/verify-certificate?id=${certificate.certificateId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr: string | Date | undefined) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return String(dateStr);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text selection:bg-primary selection:text-white font-sans antialiased flex flex-col">
      <PublicNavbar />

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <main className="flex-1 mx-auto max-w-4xl w-full px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Back Link & Header Title */}
        <div className="space-y-4 no-print">
          <Link
            href={isAuthenticated ? "/battle" : "/"}
            className="inline-flex items-center gap-1.5 text-xs font-mono tracking-wider uppercase text-text-muted hover:text-text transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Back to arena
          </Link>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary-subtle text-primary text-xs font-mono font-medium">
              <ShieldCheck className="size-3.5" />
              <span>OFFICIAL REGISTRY • NO SIGNUP REQUIRED</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text leading-tight">
              Internship Certificate Verification
            </h1>
            <p className="text-sm sm:text-base text-text-muted max-w-2xl leading-relaxed">
              Verify the authenticity of credentials and software engineering internship completions issued by CodeComplex. Anyone, including recruiters, hiring managers, and academic institutions, can independently validate legitimacy in real time.
            </p>
          </div>
        </div>

        {/* ── Search Input Box ────────────────────────────────────────── */}
        <div className="p-6 sm:p-8 rounded-2xl border border-border bg-surface shadow-xs space-y-5 no-print">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label htmlFor="certId" className="block text-xs font-mono uppercase tracking-wider text-text-muted">
              Enter Certificate ID / Credential Code
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-text-faint pointer-events-none" />
                <input
                  id="certId"
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                  placeholder="e.g. CC-INT-2026-001"
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-surface-2 text-text placeholder:text-text-faint text-sm sm:text-base font-mono tracking-wide focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="h-12 px-7 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm"
              >
                {loading ? (
                  <>
                    <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-4" />
                    <span>Verify Credential</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Samples */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-text-faint font-mono">Try sample:</span>
            {SAMPLE_IDS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => {
                  setSearchId(sample.id);
                  executeVerify(sample.id);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-border bg-surface-2 text-text-muted hover:text-text hover:border-primary/50 hover:bg-primary-subtle font-mono text-[11px] transition-colors cursor-pointer"
              >
                <span>{sample.id}</span>
                <span className="text-text-faint">({sample.label})</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Error / Not Found State ──────────────────────────────────── */}
        {error && !loading && (
          <div className="p-6 rounded-2xl border border-danger/30 bg-danger/10 text-danger space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5 font-bold text-base">
              <ShieldAlert className="size-6 shrink-0" />
              <span>Certificate Not Found or Invalid</span>
            </div>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              {error}
            </p>
            <div className="pt-2 border-t border-danger/20 text-xs text-text-faint space-y-1">
              <p>• Make sure the certificate ID is typed accurately (e.g., <code className="font-mono text-text">CC-INT-2026-001</code>).</p>
              <p>• Only official internship certificates issued by CodeComplex can be verified here.</p>
              <p>• If you believe this is in error, please contact <a href="mailto:support@codecomplex.site" className="underline text-primary hover:underline">support@codecomplex.site</a>.</p>
            </div>
          </div>
        )}

        {/* ── Verified Certificate Card ────────────────────────────────── */}
        {certificate && !loading && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Authenticity Status Banner */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                certificate.status === "VALID"
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : certificate.status === "REVOKED"
                  ? "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`size-11 rounded-xl flex items-center justify-center shrink-0 ${
                    certificate.status === "VALID"
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30"
                  }`}
                >
                  {certificate.status === "VALID" ? (
                    <CheckCircle2 className="size-6" />
                  ) : (
                    <AlertCircle className="size-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base sm:text-lg text-text">
                      {certificate.status === "VALID"
                        ? "Officially Verified & Authentic"
                        : certificate.status === "REVOKED"
                        ? "Credential Has Been Revoked"
                        : "Credential Expired"}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                        certificate.status === "VALID"
                          ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                          : "bg-red-500/20 border-red-500/30 text-red-600 dark:text-red-400"
                      }`}
                    >
                      {certificate.status}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">
                    Verified from the official CodeComplex registry on{" "}
                    {new Date().toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 no-print shrink-0">
                <button
                  type="button"
                  onClick={copyVerificationLink}
                  className="h-9 px-3.5 rounded-xl border border-border bg-surface hover:bg-surface-2 text-text text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Copy shareable verification link"
                >
                  {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                  <span>{copied ? "Link Copied!" : "Copy Link"}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="h-9 px-3.5 rounded-xl border border-border bg-surface hover:bg-surface-2 text-text text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Print or save PDF of verified credential"
                >
                  <Printer className="size-3.5" />
                  <span>Print / PDF</span>
                </button>
              </div>
            </div>

            {/* Revocation Warning Box if Revoked */}
            {certificate.status === "REVOKED" && certificate.revocationReason && (
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/[0.05] text-xs text-red-600 dark:text-red-300 space-y-1">
                <span className="font-bold uppercase tracking-wider text-red-500">Reason for Revocation:</span>
                <p>{certificate.revocationReason}</p>
              </div>
            )}

            {/* Official Credential Document / Plaque */}
            <div className="relative rounded-3xl border border-border bg-surface p-8 sm:p-12 overflow-hidden shadow-xl printable-certificate">
              {/* Background Watermark Pattern */}
              <div className="absolute -right-16 -bottom-16 size-80 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.06] pointer-events-none">
                <LogoMark size={220} />
              </div>

              <div className="relative space-y-8">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-border pb-8">
                  <div className="flex items-center gap-3">
                    <LogoMark size={36} />
                    <div>
                      <span className="text-xl font-bold tracking-tight text-text">
                        Code<span className="text-primary">Complex</span>
                      </span>
                      <p className="text-[11px] font-mono uppercase tracking-widest text-text-faint">
                        Engineering Division • Official Registry
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-text-faint">Credential ID</div>
                    <div className="text-base sm:text-lg font-mono font-bold text-primary tracking-wider">
                      {certificate.certificateId}
                    </div>
                  </div>
                </div>

                {/* Plaque Title */}
                <div className="text-center space-y-2 py-2">
                  <span className="text-xs font-mono uppercase tracking-[0.25em] text-primary font-bold">
                    Official Certificate of Completion
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-text">
                    Software Engineering Internship
                  </h2>
                  <p className="text-xs sm:text-sm text-text-muted font-mono">
                    Issued by CodeComplex Global Engineering Platform
                  </p>
                </div>

                {/* Recipient Details */}
                <div className="text-center py-5 space-y-2 border-y border-border bg-surface-2 rounded-2xl">
                  <span className="text-xs font-mono uppercase tracking-wider text-text-faint">
                    This is proudly presented to
                  </span>
                  <div className="text-3xl sm:text-5xl font-extrabold tracking-tight text-text">
                    {certificate.recipientName}
                  </div>
                  <div className="text-sm sm:text-base font-semibold text-primary">
                    {certificate.role} • {certificate.domain}
                  </div>
                  {certificate.grade && (
                    <div className="inline-block mt-2 px-3 py-1 rounded-full border border-primary/30 bg-primary-subtle text-xs font-mono font-semibold text-primary">
                      {certificate.grade}
                    </div>
                  )}
                </div>

                {/* Scope Description */}
                <div className="space-y-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-text-faint">
                    Program Scope & Deliverables
                  </span>
                  <p className="text-sm sm:text-base text-text-muted leading-relaxed">
                    {certificate.description}
                  </p>
                </div>

                {/* Key Skills & Competencies Verified */}
                {certificate.skills && certificate.skills.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-xs font-mono uppercase tracking-wider text-text-faint">
                      Verified Technical Competencies
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {certificate.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 rounded-lg border border-border bg-surface-2 text-text text-xs font-mono"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border text-xs">
                  <div className="p-3.5 rounded-xl border border-border bg-surface-2 space-y-1">
                    <span className="font-mono text-text-faint uppercase block">Duration</span>
                    <span className="font-semibold text-text">{certificate.duration}</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border bg-surface-2 space-y-1">
                    <span className="font-mono text-text-faint uppercase block">Internship Period</span>
                    <span className="font-semibold text-text">
                      {formatDate(certificate.startDate)} — {formatDate(certificate.endDate)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border bg-surface-2 space-y-1">
                    <span className="font-mono text-text-faint uppercase block">Issue Date</span>
                    <span className="font-semibold text-text">{formatDate(certificate.issueDate)}</span>
                  </div>
                </div>

                {/* Signatures & Verification Authority */}
                <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div>
                    {certificate.signatoryName === "Pawan Singh" && (
                      <div className="mb-1.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/signature_pawan.png"
                          alt="Pawan Singh Signature"
                          className="h-9 object-contain dark:hidden"
                        />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/signature_pawan_white.png"
                          alt="Pawan Singh Signature"
                          className="h-9 object-contain hidden dark:block opacity-95"
                        />
                      </div>
                    )}
                    <div className="font-bold text-text text-base">
                      {certificate.signatoryName || "Umang Sisodia"}
                    </div>
                    <div className="text-xs text-text-muted font-mono">
                      {certificate.signatoryTitle || "Founding Director & Lead Architect"}
                    </div>
                    <div className="text-[11px] text-primary font-mono mt-0.5">
                      {certificate.issuer || "CodeComplex Engineering Division"}
                    </div>
                  </div>

                  <div className="text-left sm:text-right space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                      <CheckCircle2 className="size-3.5" />
                      <span>Tamper-Proof Registry Record</span>
                    </div>
                    <div className="text-[11px] text-text-muted font-mono">
                      Total Verifications: {certificate.verificationCount || 1}
                    </div>
                    <div className="text-[10px] text-text-faint font-mono">
                      https://codecomplex.site/verify-certificate?id={certificate.certificateId}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Initial Empty Explainer (When nothing searched yet) ──────── */}
        {!certificate && !error && !loading && (
          <div className="space-y-10 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl border border-border bg-surface shadow-xs space-y-3">
                <div className="size-10 rounded-xl bg-primary-subtle border border-primary/20 text-primary flex items-center justify-center">
                  <ShieldCheck className="size-5" />
                </div>
                <h3 className="font-bold text-text text-base">Instant Public Validation</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Anyone can confirm validity without logging in, signing up, or waiting for manual confirmation.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-surface shadow-xs space-y-3">
                <div className="size-10 rounded-xl bg-primary-subtle border border-primary/20 text-primary flex items-center justify-center">
                  <Cpu className="size-5" />
                </div>
                <h3 className="font-bold text-text text-base">Rigorous Technical Bar</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Interns at CodeComplex build real-time socket clusters, container sandboxes, and competitive engineering features.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-surface shadow-xs space-y-3">
                <div className="size-10 rounded-xl bg-primary-subtle border border-primary/20 text-primary flex items-center justify-center">
                  <Layers className="size-5" />
                </div>
                <h3 className="font-bold text-text text-base">Multi-Tier Honors</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Credentials reflect verified work, distinction tiers (Honors / Top 10%), and verifiable code contribution histories.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-3xl border border-border bg-surface-2 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <h4 className="font-bold text-text text-base">Are you a recruiter or hiring manager?</h4>
                <p className="text-xs text-text-muted max-w-xl leading-relaxed">
                  Every CodeComplex internship candidate passes through our live competitive sandboxes. Enter their credential ID above to verify their project scope, dates, and evaluated performance.
                </p>
              </div>
              <Link
                href="/battle"
                className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-xs transition-colors shrink-0 shadow-xs"
              >
                Explore Arena
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-border bg-surface py-8 text-center text-xs text-text-muted mt-12 no-print">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© {new Date().getFullYear()} CodeComplex. Official Engineering Credentials & Audits.</span>
          <span>Credential ID format: CC-INT-YYYY-XXXX</span>
        </div>
      </footer>
    </div>
  );
}

export default function VerifyCertificatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg text-text flex items-center justify-center">
          <div className="animate-spin size-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <CertificateVerifierContent />
    </Suspense>
  );
}
