"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BellOff,
  BellRing,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Settings,
  Mail,
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { Button, Card, Alert } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";

const NOTIFICATION_LABELS: Record<string, { title: string; desc: string }> = {
  revisionReminders: {
    title: "Daily Spaced-Repetition Reminders",
    desc: "Daily revision reminders for problems in your spaced-repetition queue.",
  },
  grindReminders: {
    title: "Inactivity & Streak Reminders",
    desc: "Weekly reminder nudges when you have been inactive for over 7 days.",
  },
  welcomeAndAnnouncements: {
    title: "Platform Updates & Announcements",
    desc: "Onboarding tips, feature announcements, and community updates.",
  },
};

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const type = searchParams.get("type") || "";
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState<"loading" | "disabled" | "enabled" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const info = NOTIFICATION_LABELS[type] || {
    title: "Email Notifications",
    desc: "Notifications for your CodeComplex account.",
  };

  useEffect(() => {
    if (!email || !type || !token) {
      setStatus("error");
      setErrorMsg("Missing or incomplete unsubscribe link parameters.");
      return;
    }

    // Automatically apply unsubscribe on page load
    api("/user/unsubscribe", {
      method: "POST",
      body: { email, type, token, enabled: false },
    })
      .then(() => {
        setStatus("disabled");
      })
      .catch((err) => {
        setStatus("error");
        setErrorMsg(errorMessage(err));
      });
  }, [email, type, token]);

  async function handleToggle(enable: boolean) {
    setBusy(true);
    try {
      await api("/user/unsubscribe", {
        method: "POST",
        body: { email, type, token, enabled: enable },
      });
      setStatus(enable ? "enabled" : "disabled");
    } catch (err) {
      setErrorMsg(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-xl border-border bg-surface">
        {status === "loading" && (
          <div className="py-8 space-y-4">
            <Loader2 className="size-10 animate-spin text-primary mx-auto" />
            <h1 className="text-xl font-bold text-text">Updating Preferences</h1>
            <p className="text-sm text-text-muted">
              Turning off {info.title.toLowerCase()} for your account...
            </p>
          </div>
        )}

        {status === "disabled" && (
          <div className="space-y-6">
            <div className="size-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
              <BellOff className="size-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-text">Notifications Turned Off</h1>
              <p className="text-sm text-text-muted leading-relaxed">
                You will no longer receive <strong className="text-text">{info.title}</strong> at{" "}
                <strong className="text-text">{email}</strong>.
              </p>
            </div>

            <div className="rounded-lg bg-surface-2 p-3 text-xs text-text-faint border border-border">
              {info.desc}
            </div>

            <div className="pt-2 space-y-3">
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                loading={busy}
                onClick={() => handleToggle(true)}
              >
                <BellRing className="size-4" /> Turn back on
              </Button>

              <div className="flex gap-2">
                <Link href="/settings?tab=notifications" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Settings className="size-4" /> All settings
                  </Button>
                </Link>
                <Link href="/problems" className="flex-1">
                  <Button variant="primary" size="sm" className="w-full">
                    Arena <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {status === "enabled" && (
          <div className="space-y-6">
            <div className="size-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="size-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-text">Notifications Re-enabled</h1>
              <p className="text-sm text-text-muted leading-relaxed">
                You will continue receiving <strong className="text-text">{info.title}</strong> at{" "}
                <strong className="text-text">{email}</strong>.
              </p>
            </div>

            <div className="pt-2 space-y-3">
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                loading={busy}
                onClick={() => handleToggle(false)}
              >
                <BellOff className="size-4" /> Turn off again
              </Button>

              <Link href="/settings?tab=notifications" className="block">
                <Button variant="outline" size="sm" className="w-full">
                  <Settings className="size-4" /> Manage all notifications
                </Button>
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-6">
            <div className="size-16 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto border border-danger/20">
              <AlertCircle className="size-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-text">Unable to Update</h1>
              <p className="text-sm text-text-muted leading-relaxed">
                {errorMsg || "This unsubscribe link is invalid or has expired."}
              </p>
            </div>

            <div className="pt-2 space-y-3">
              <Link href="/settings?tab=notifications" className="block">
                <Button variant="primary" size="sm" className="w-full">
                  <Settings className="size-4" /> Open Notification Settings
                </Button>
              </Link>
              <Link href="/login" className="block">
                <Button variant="ghost" size="sm" className="w-full">
                  Log in to your account
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen bg-bg text-text selection:bg-primary selection:text-white font-sans antialiased flex flex-col">
      <PublicNavbar />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        }
      >
        <UnsubscribeContent />
      </Suspense>
    </div>
  );
}
