"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, errorMessage } from "@/lib/api";
import { Alert, Button, Input } from "@/components/ui";

type Step = "form" | "verify";

export default function SignupPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
  });
  const [otp, setOtp] = useState("");

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api("/user/signup", { method: "POST", body: form });
      setNotice(`We sent a 6-digit code to ${form.email}.`);
      setStep("verify");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api("/user/signup/verify", {
        method: "POST",
        body: { email: form.email, otp },
      });
      router.replace("/login?verified=1");
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  async function onResend() {
    setError(null);
    try {
      await api("/user/otp/resend", {
        method: "POST",
        body: { email: form.email, purpose: "EMAIL_VERIFICATION" },
      });
      setNotice("A new code is on its way.");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  if (step === "verify") {
    return (
      <div>
        <h1 className="text-base font-semibold text-text">Check your inbox</h1>
        <p className="mt-0.5 text-xs text-text-muted">
          Enter the verification code to activate your account.
        </p>

        <form onSubmit={onVerify} className="mt-5 flex flex-col gap-3">
          {error && <Alert>{error}</Alert>}
          {!error && notice && <Alert tone="info">{notice}</Alert>}
          <Input
            label="Verification code"
            name="otp"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="text-center font-mono text-lg tracking-[0.5em]"
          />
          <Button type="submit" loading={loading}>
            Verify email
          </Button>
          <button
            type="button"
            onClick={onResend}
            className="text-xs text-text-muted hover:text-primary"
          >
            Didn&apos;t get it? Resend code
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-base font-semibold text-text">Join the arena</h1>
      <p className="mt-0.5 text-xs text-text-muted">
        One account, six ladders to climb.
      </p>

      <form onSubmit={onSignup} className="mt-5 flex flex-col gap-3">
        {error && <Alert>{error}</Alert>}
        <Input
          label="Full name"
          name="fullName"
          required
          minLength={3}
          maxLength={50}
          value={form.fullName}
          onChange={(e) => set("fullName", e.target.value)}
          placeholder="Ada Lovelace"
        />
        <Input
          label="Username"
          name="username"
          required
          minLength={3}
          maxLength={30}
          value={form.username}
          onChange={(e) => set("username", e.target.value.toLowerCase())}
          placeholder="ada_lovelace"
          hint="Lowercase, 3–30 characters. This is your arena tag."
        />
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="you@example.com"
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          placeholder="At least 8 characters"
        />
        <Button type="submit" loading={loading}>
          Create account
        </Button>
      </form>

      <div className="mt-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-text-muted">or continue with</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
          className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-surface-hover"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </a>
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL}/auth/github`}
          className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-surface-hover"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
          </svg>
          GitHub
        </a>
      </div>

      <p className="mt-5 text-center text-xs text-text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
