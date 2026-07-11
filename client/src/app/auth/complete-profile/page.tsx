"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, errorMessage } from "@/lib/api";
import type { Me } from "@/lib/types";
import { useAuth } from "@/stores/auth-store";
import { Alert, Avatar, Button, Input } from "@/components/ui";
import { avatarUrl } from "@/lib/types";
import { LogoMark } from "@/components/logo";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, setUser } = useAuth();

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api<Me>("/auth/complete-profile", {
        method: "POST",
        body: { username: username.toLowerCase(), fullName },
      });
      const me = await api<Me>("/user/me");
      setUser(me);
      router.replace("/battle");
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-10">
      <Link href="/" className="mb-6 flex items-center gap-2">
        <LogoMark size={28} />
        <span className="text-lg font-bold tracking-tight text-text">
          Code<span className="text-primary">Complex</span>
        </span>
      </Link>
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-5 shadow-sm">
        <div className="flex flex-col items-center gap-3 mb-5">
          <Avatar
            src={user ? avatarUrl(user.avatar) : undefined}
            name={user?.fullName}
            size={64}
            className="ring-4 ring-border"
          />
          <div className="text-center">
            <h1 className="text-base font-semibold text-text">
              Complete your profile
            </h1>
            <p className="mt-0.5 text-xs text-text-muted">
              Choose a username and display name for the arena.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          {error && <Alert>{error}</Alert>}
          <Input
            label="Display name"
            name="fullName"
            required
            minLength={3}
            maxLength={50}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ada Lovelace"
          />
          <Input
            label="Username"
            name="username"
            required
            minLength={3}
            maxLength={30}
            value={username}
            onChange={(e) =>
              setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
            }
            placeholder="ada_lovelace"
            hint="Lowercase letters, numbers, and underscores. This is your arena tag."
          />
          <Button type="submit" loading={loading}>
            Let&apos;s go
          </Button>
        </form>
      </div>
    </div>
  );
}
