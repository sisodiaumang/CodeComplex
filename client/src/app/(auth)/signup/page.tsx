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

      <p className="mt-5 text-center text-xs text-text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
