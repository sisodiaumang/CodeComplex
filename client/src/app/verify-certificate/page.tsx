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

const SAMPLE_IDS = [
  { id: "CC-INT-2026-001", label: "Full Stack (Summer '26)" },
  { id: "CC-INT-2026-002", label: "Backend Systems" },
  { id: "CC-INT-2026-003", label: "Frontend Architecture" },
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
    const origin = typeof window !== "undefined" ? window.location.origin : "https://codecomplex.site";
    const url = `${origin}/verify-certificate?id=${encodeURIComponent(certificate.certificateId)}`;
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
    <div className="min-h-screen bg-[#0B0B0C] text-[#EFEDE8] selection:bg-[#FF7A1A] selection:text-[#0B0B0C] font-sans antialiased">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0B0B0C]/85 backdrop-blur-md no-print">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 h-16">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-base tracking-tight text-white hover:opacity-90 transition-opacity"
          >
            <LogoMark size={24} />
            <span>
              Code<span className="text-[#FF7A1A]">Complex</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <ThemeToggle className="text-white/70 hover:text-white" />
            <Link
              href="/battle"
              className="text-xs font-medium text-white/70 hover:text-white transition-colors hidden sm:inline-block"
            >
              Battle Arena
            </Link>
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {user.role && ["ADMIN", "MODERATOR", "OWNER"].includes(user.role) && (
                  <Link
                    href="/admin"
                    className="text-xs font-mono font-medium text-[#FF7A1A] hover:underline transition-colors hidden sm:inline-block"
                  >
                    Admin Console
                  </Link>
                )}
                <Link
                  href={`/profile/${user.username}`}
                  className="inline-flex items-center gap-2 h-8 pl-1 pr-3 rounded-full border border-white/20 bg-white/[0.04] text-xs font-medium text-white hover:border-[#FF7A1A]/40 transition-colors"
                >
                  <Avatar src={user.avatar?.profileImageURL} name={user.username} size={22} />
                  <span>{user.username}</span>
                </Link>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-medium text-white/70 hover:text-white transition-colors hidden sm:inline-block"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center h-8 px-3.5 rounded-full border border-white/20 text-xs font-mono tracking-wider uppercase text-white/80 hover:text-white hover:border-white/40 transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-14 space-y-10">
        {/* Back Link & Header Title */}
        <div className="space-y-4 no-print">
          <Link
            href={isAuthenticated ? "/battle" : "/"}
            className="inline-flex items-center gap-1.5 text-xs font-mono tracking-wider uppercase text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Back to arena
          </Link>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#FF7A1A]/30 bg-[#FF7A1A]/10 text-[#FF7A1A] text-xs font-mono">
              <ShieldCheck className="size-3.5" />
              <span>OFFICIAL REGISTRY ? NO SIGNUP REQUIRED</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              Internship Certificate Verification
            </h1>
            <p className="text-sm sm:text-base text-white/60 max-w-2xl leading-relaxed">
              Verify the authenticity of credentials and software engineering internship completions issued by CodeComplex. Anyone, including recruiters, hiring managers, and academic institutions, can independently validate legitimacy in real time.
            </p>
          </div>
        </div>

        {/* ── Search Input Box ────────────────────────────────────────── */}
        <div className="p-6 sm:p-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] shadow-2xl space-y-5 no-print">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label htmlFor="certId" className="block text-xs font-mono uppercase tracking-wider text-white/70">
              Enter Certificate ID / Credential Code
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-white/40 pointer-events-none" />
                <input
                  id="certId"
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                  placeholder="e.g. CC-INT-2026-001"
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-white/15 bg-black/40 text-white placeholder:text-white/30 text-sm sm:text-base font-mono tracking-wide focus:outline-none focus:border-[#FF7A1A] focus:ring-1 focus:ring-[#FF7A1A] transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="h-12 px-7 rounded-xl bg-[#FF7A1A] hover:bg-[#FF9040] text-black font-semibold text-sm transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-lg shadow-[#FF7A1A]/20"
              >
                {loading ? (
                  <>
                    <span className="size-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
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
            <span className="text-white/40 font-mono">Try sample:</span>
            {SAMPLE_IDS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => {
                  setSearchId(sample.id);
                  executeVerify(sample.id);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-white/10 bg-white/[0.04] text-white/70 hover:text-white hover:border-[#FF7A1A]/50 hover:bg-[#FF7A1A]/5 font-mono text-[11px] transition-colors cursor-pointer"
              >
                <span>{sample.id}</span>
                <span className="text-white/30">({sample.label})</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Error / Not Found State ──────────────────────────────────── */}
        {error && !loading && (
          <div className="p-6 rounded-2xl border border-red-500/30 bg-red-500/[0.06] text-red-200 space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5 text-red-400 font-bold text-base">
              <ShieldAlert className="size-6 shrink-0" />
              <span>Certificate Not Found or Invalid</span>
            </div>
            <p className="text-xs sm:text-sm text-red-200/80 leading-relaxed">
              {error}
            </p>
            <div className="pt-2 border-t border-red-500/20 text-xs text-red-300/70 space-y-1">
              <p>• Make sure the certificate ID is typed accurately (e.g., <code className="font-mono text-red-200">CC-INT-2026-001</code>).</p>
              <p>• Only official internship certificates issued by CodeComplex can be verified here.</p>
              <p>• If you believe this is in error, please contact <a href="mailto:support@codecomplex.site" className="underline hover:text-white">support@codecomplex.site</a>.</p>
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
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 shadow-lg shadow-emerald-500/5"
                  : certificate.status === "REVOKED"
                  ? "border-red-500/40 bg-red-500/10 text-red-300"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-300"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`size-11 rounded-xl flex items-center justify-center shrink-0 ${
                    certificate.status === "VALID"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
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
                    <span className="font-bold text-base sm:text-lg text-white">
                      {certificate.status === "VALID"
                        ? "Officially Verified & Authentic"
                        : certificate.status === "REVOKED"
                        ? "Credential Has Been Revoked"
                        : "Credential Expired"}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                        certificate.status === "VALID"
                          ? "bg-emerald-400/20 border-emerald-400/30 text-emerald-300"
                          : "bg-red-400/20 border-red-400/30 text-red-300"
                      }`}
                    >
                      {certificate.status}
                    </span>
                  </div>
                  <p className="text-xs text-white/60">
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
                  className="h-9 px-3.5 rounded-xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Copy shareable verification link"
                >
                  {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                  <span>{copied ? "Link Copied!" : "Copy Link"}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="h-9 px-3.5 rounded-xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Print or save PDF of verified credential"
                >
                  <Printer className="size-3.5" />
                  <span>Print / PDF</span>
                </button>
              </div>
            </div>

            {/* Revocation Warning Box if Revoked */}
            {certificate.status === "REVOKED" && certificate.revocationReason && (
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/[0.05] text-xs text-red-300 space-y-1">
                <span className="font-bold uppercase tracking-wider text-red-400">Reason for Revocation:</span>
                <p>{certificate.revocationReason}</p>
              </div>
            )}

            {/* Official Credential Document / Plaque */}
            <div className="relative rounded-3xl border border-white/15 bg-[#101014] p-8 sm:p-12 overflow-hidden shadow-2xl printable-certificate">
              {/* Background Watermark Pattern */}
              <div className="absolute -right-16 -bottom-16 size-80 rounded-full bg-[#FF7A1A]/[0.03] blur-3xl pointer-events-none" />
              <div className="absolute top-0 right-0 p-8 opacity-[0.04] pointer-events-none">
                <LogoMark size={220} />
              </div>

              <div className="relative space-y-8">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/[0.08] pb-8">
                  <div className="flex items-center gap-3">
                    <LogoMark size={36} />
                    <div>
                      <span className="text-xl font-bold tracking-tight text-white">
                        Code<span className="text-[#FF7A1A]">Complex</span>
                      </span>
                      <p className="text-[11px] font-mono uppercase tracking-widest text-white/40">
                        Engineering Division ? Official Registry
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-white/40">Credential ID</div>
                    <div className="text-base sm:text-lg font-mono font-bold text-[#FF7A1A] tracking-wider">
                      {certificate.certificateId}
                    </div>
                  </div>
                </div>

                {/* Plaque Title */}
                <div className="text-center space-y-2 py-2">
                  <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#FF7A1A]">
                    Official Certificate of Completion
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
                    Software Engineering Internship
                  </h2>
                  <p className="text-xs sm:text-sm text-white/50 font-mono">
                    Issued by CodeComplex Global Engineering Platform
                  </p>
                </div>

                {/* Recipient Details */}
                <div className="text-center py-4 space-y-2 border-y border-white/[0.06] bg-white/[0.01] rounded-2xl">
                  <span className="text-xs font-mono uppercase tracking-wider text-white/40">
                    This is proudly presented to
                  </span>
                  <div className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                    {certificate.recipientName}
                  </div>
                  <div className="text-sm sm:text-base font-medium text-[#FF7A1A]">
                    {certificate.role} ? {certificate.domain}
                  </div>
                  {certificate.grade && (
                    <div className="inline-block mt-2 px-3 py-1 rounded-full border border-[#FF7A1A]/30 bg-[#FF7A1A]/10 text-xs font-mono font-semibold text-[#FF7A1A]">
                      {certificate.grade}
                    </div>
                  )}
                </div>

                {/* Scope Description */}
                <div className="space-y-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-white/40">
                    Program Scope & Deliverables
                  </span>
                  <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                    {certificate.description}
                  </p>
                </div>

                {/* Key Skills & Competencies Verified */}
                {certificate.skills && certificate.skills.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-xs font-mono uppercase tracking-wider text-white/40">
                      Verified Technical Competencies
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {certificate.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 rounded-lg border border-white/10 bg-white/[0.03] text-white/80 text-xs font-mono"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/[0.08] text-xs">
                  <div className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-1">
                    <span className="font-mono text-white/40 uppercase block">Duration</span>
                    <span className="font-semibold text-white">{certificate.duration}</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-1">
                    <span className="font-mono text-white/40 uppercase block">Internship Period</span>
                    <span className="font-semibold text-white">
                      {formatDate(certificate.startDate)} — {formatDate(certificate.endDate)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-1">
                    <span className="font-mono text-white/40 uppercase block">Issue Date</span>
                    <span className="font-semibold text-white">{formatDate(certificate.issueDate)}</span>
                  </div>
                </div>

                {/* Signatures & Verification Authority */}
                <div className="pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div>
                    <div className="font-bold text-white text-base">
                      {certificate.signatoryName || "Umang Sisodia"}
                    </div>
                    <div className="text-xs text-white/50 font-mono">
                      {certificate.signatoryTitle || "Founding Director & Lead Architect"}
                    </div>
                    <div className="text-[11px] text-[#FF7A1A]/80 font-mono mt-0.5">
                      {certificate.issuer || "CodeComplex Engineering Division"}
                    </div>
                  </div>

                  <div className="text-left sm:text-right space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-medium">
                      <CheckCircle2 className="size-3.5" />
                      <span>Tamper-Proof Registry Record</span>
                    </div>
                    <div className="text-[11px] text-white/40 font-mono">
                      Total Verifications: {certificate.verificationCount || 1}
                    </div>
                    <div className="text-[10px] text-white/30 font-mono">
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
              <div className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-3">
                <div className="size-10 rounded-xl bg-[#FF7A1A]/10 border border-[#FF7A1A]/20 text-[#FF7A1A] flex items-center justify-center">
                  <ShieldCheck className="size-5" />
                </div>
                <h3 className="font-bold text-white text-base">Instant Public Validation</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Anyone can confirm validity without logging in, signing up, or waiting for manual confirmation.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-3">
                <div className="size-10 rounded-xl bg-[#FF7A1A]/10 border border-[#FF7A1A]/20 text-[#FF7A1A] flex items-center justify-center">
                  <Cpu className="size-5" />
                </div>
                <h3 className="font-bold text-white text-base">Rigorous Technical Bar</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Interns at CodeComplex build real-time socket clusters, container sandboxes, and competitive engineering features.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-3">
                <div className="size-10 rounded-xl bg-[#FF7A1A]/10 border border-[#FF7A1A]/20 text-[#FF7A1A] flex items-center justify-center">
                  <Layers className="size-5" />
                </div>
                <h3 className="font-bold text-white text-base">Tamper-Proof Registry</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Unique serial codes map directly to immutable database records with live audit stamps and revocation tracking.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">Are you an employer or recruiter?</h4>
                <p className="text-xs text-white/50">
                  Every internship candidate receives a unique Certificate ID printed on their credentials. Enter it above to see full performance metrics.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchId("CC-INT-2026-001");
                  executeVerify("CC-INT-2026-001");
                }}
                className="h-9 px-4 rounded-xl border border-[#FF7A1A]/40 bg-[#FF7A1A]/10 text-[#FF7A1A] hover:bg-[#FF7A1A]/20 text-xs font-mono transition-colors shrink-0 cursor-pointer"
              >
                Inspect Sample Credential
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.08] bg-[#0B0B0C] py-8 text-center text-xs text-white/40 mt-16 no-print">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© {new Date().getFullYear()} CodeComplex. Official Internship Credential Registry.</span>
          <span>Built by Umang Sisodia</span>
        </div>
      </footer>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
          .printable-certificate {
            background: #ffffff !important;
            color: #000000 !important;
            border: 2px solid #000000 !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 24px !important;
          }
          .printable-certificate * {
            color: #000000 !important;
            text-shadow: none !important;
          }
          .printable-certificate .text-\\[\\#FF7A1A\\] {
            color: #d9531e !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function VerifyCertificatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center text-white">
          <div className="flex items-center gap-3 text-sm font-mono text-white/60">
            <span className="size-4 border-2 border-[#FF7A1A] border-t-transparent rounded-full animate-spin" />
            <span>Loading CodeComplex Registry...</span>
          </div>
        </div>
      }
    >
      <CertificateVerifierContent />
    </Suspense>
  );
}
