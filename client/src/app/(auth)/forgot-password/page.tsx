"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, errorMessage } from "@/lib/api";
import { Alert, Button, Input } from "@/components/ui";

type Step = "email" | "reset";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  async function onRequest(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api("/user/password/forgot", { method: "POST", body: { email } });
      setNotice("If this email is registered, a reset code has been sent.");
      setStep("reset");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function onReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api("/user/password/reset", {
        method: "POST",
        body: { email, otp, newPassword },
      });
      router.replace("/login?reset=1");
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-base font-semibold text-text">
        Reset your password
      </h1>
      <p className="mt-0.5 text-xs text-text-muted">
        {step === "email"
          ? "Enter your account email and we'll send a reset code."
          : "Enter the code from your inbox and choose a new password."}
      </p>

      {step === "email" ? (
        <form onSubmit={onRequest} className="mt-5 flex flex-col gap-3">
          {error && <Alert>{error}</Alert>}
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Button type="submit" loading={loading}>
            Send reset code
          </Button>
        </form>
      ) : (
        <form onSubmit={onReset} className="mt-5 flex flex-col gap-3">
          {error && <Alert>{error}</Alert>}
          {!error && notice && <Alert tone="info">{notice}</Alert>}
          <Input
            label="Reset code"
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
          <Input
            label="New password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
          <Button type="submit" loading={loading}>
            Reset password
          </Button>
        </form>
      )}

      <p className="mt-5 text-center text-xs text-text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
