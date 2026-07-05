"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, errorMessage } from "@/lib/api";
import type { Me } from "@/lib/types";
import { useAuth } from "@/stores/auth-store";
import { Alert, Button, Input } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuth((s) => s.setUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api<{ user: Me }>("/user/login", {
        method: "POST",
        body: { email, password },
      });
      // Cookie is set by the server; hydrate the store and go in.
      const me = data?.user ?? (await api<Me>("/user/me"));
      setUser(me);
      router.replace("/dashboard");
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-base font-semibold text-text">Welcome back</h1>
      <p className="mt-0.5 text-xs text-text-muted">
        Log in to rejoin the arena.
      </p>

      <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3">
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
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        <div className="-mt-2 text-right">
          <Link
            href="/forgot-password"
            className="text-xs text-text-muted hover:text-primary"
          >
            Forgot password?
          </Link>
        </div>
        <Button type="submit" loading={loading}>
          Log in
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-text-muted">
        New to devArena?{" "}
        <Link href="/signup" className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
