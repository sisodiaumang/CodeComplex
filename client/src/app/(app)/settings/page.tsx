"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  KeyRound,
  Mail,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { avatarUrl, type Me } from "@/lib/types";
import { COUNTRIES } from "@/lib/countries";
import { useAuth } from "@/stores/auth-store";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Input,
  Select,
} from "@/components/ui";

/* ─── types ───────────────────────────────────────────────────────────── */

type Feedback = { tone: "success" | "danger" | "info"; text: string } | null;

type Tab = "profile" | "security";

/* ─── helpers ─────────────────────────────────────────────────────────── */

function forceRelogin(
  setUser: (u: Me | null) => void,
  queryClient: ReturnType<typeof useQueryClient>,
  router: ReturnType<typeof useRouter>
) {
  setUser(null);
  queryClient.clear();
  router.replace("/login");
}

function SectionTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-6 py-5">
      <div className="flex size-9 items-center justify-center rounded-lg bg-surface-2">
        <Icon className="size-4 text-text-muted" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-text">{title}</h2>
        {subtitle && (
          <p className="text-sm text-text-faint">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

/* ─── main page ───────────────────────────────────────────────────────── */

export default function SettingsPage() {
  const { user, setUser, patchUser } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profile");

  if (!user) return null;

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "profile", label: "Profile", icon: User },
    { key: "security", label: "Security", icon: Shield },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-2">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Settings</h1>
        <p className="mt-1 text-sm text-text-faint">
          Manage your account and preferences
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg border border-border bg-surface-2 p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
              tab === key
                ? "bg-surface text-text shadow-sm"
                : "text-text-muted hover:text-text"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "profile" ? (
        <ProfileTab user={user} patchUser={patchUser} queryClient={queryClient} />
      ) : (
        <SecurityTab
          user={user}
          patchUser={patchUser}
          onForceRelogin={() => forceRelogin(setUser, queryClient, router)}
        />
      )}
    </div>
  );
}

/* ─── Profile Tab ─────────────────────────────────────────────────────── */

function ProfileTab({
  user,
  patchUser,
  queryClient,
}: {
  user: Me;
  patchUser: (p: Partial<Me>) => void;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [bio, setBio] = useState(user.bio ?? "");
  const [country, setCountry] = useState(user.country ?? "IN");
  const [msg, setMsg] = useState<Feedback>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);

  async function onAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarBusy(true);
    setMsg(null);
    try {
      const form = new FormData();
      form.append("avatar", file);
      const res = await api<{ avatar: Me["avatar"] }>("/user/avatar", {
        method: "PATCH",
        body: form,
      });
      patchUser({ avatar: res.avatar });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setMsg({ tone: "success", text: "Photo updated." });
    } catch (err) {
      setMsg({ tone: "danger", text: errorMessage(err) });
    } finally {
      setAvatarBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function saveProfile() {
    setSaveBusy(true);
    setMsg(null);
    try {
      if (bio !== (user.bio ?? "")) {
        await api("/user/bio", { method: "PATCH", body: { bio } });
        patchUser({ bio });
      }
      if (country !== (user.country ?? "")) {
        await api("/user/country", { method: "PATCH", body: { country } });
        patchUser({ country });
      }
      setMsg({ tone: "success", text: "Profile saved." });
    } catch (err) {
      setMsg({ tone: "danger", text: errorMessage(err) });
    } finally {
      setSaveBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Avatar card */}
      <Card>
        <SectionTitle icon={Camera} title="Avatar" subtitle="Your profile picture" />
        <div className="border-t border-border px-6 py-6">
          {msg && msg.text.includes("Photo") && (
            <div className="mb-4">
              <Alert tone={msg.tone}>{msg.text}</Alert>
            </div>
          )}
          <div className="flex items-center gap-6">
            <div className="relative shrink-0 size-24 overflow-hidden rounded-full ring-4 ring-border">
              <Avatar
                src={avatarUrl(user.avatar)}
                name={user.username}
                size={96}
              />
              {avatarBusy && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                  <div className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-text">{user.fullName}</p>
              <p className="text-xs text-text-faint">@{user.username}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileRef.current?.click()}
                loading={avatarBusy}
              >
                <Camera className="size-4" /> Upload new photo
              </Button>
              <p className="text-xs text-text-faint">
                JPG, PNG or WebP. Max 5MB.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={onAvatarPick}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Info card */}
      <Card>
        <SectionTitle
          icon={User}
          title="Personal info"
          subtitle="Your public profile details"
        />
        <div className="space-y-5 border-t border-border px-6 py-6">
          {msg && !msg.text.includes("Photo") && (
            <Alert tone={msg.tone}>{msg.text}</Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Username" value={user.username} disabled />
            <Select
              label="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="bio"
              className="text-[15px] font-medium text-text"
            >
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              maxLength={200}
              rows={3}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the world who you are..."
              className="w-full resize-none rounded-lg border border-border bg-surface px-4 py-3 text-[15px] text-text placeholder:text-text-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
            />
            <p className="text-right text-xs text-text-faint">
              {bio.length}/200
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={saveProfile} loading={saveBusy} size="sm">
              Save changes
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ─── Security Tab ────────────────────────────────────────────────────── */

function SecurityTab({
  user,
  patchUser,
  onForceRelogin,
}: {
  user: Me;
  patchUser: (p: Partial<Me>) => void;
  onForceRelogin: () => void;
}) {
  return (
    <div className="space-y-5">
      {!user.oauthProvider && <ChangePasswordCard onDone={onForceRelogin} />}
      <ChangeEmailCard
        currentEmail={user.email}
        onUpdated={(email) => patchUser({ email })}
      />
      <DangerZoneCard isOAuth={!!user.oauthProvider} onDeleted={onForceRelogin} />
    </div>
  );
}

/* ─── Change Password ─────────────────────────────────────────────────── */

function ChangePasswordCard({ onDone }: { onDone: () => void }) {
  const [oldPassword, setOld] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<Feedback>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (newPassword !== confirm) {
      setMsg({ tone: "danger", text: "Passwords don't match." });
      return;
    }
    setBusy(true);
    try {
      await api("/user/password/change", {
        method: "POST",
        body: { oldPassword, newPassword },
      });
      setMsg({
        tone: "success",
        text: "Password changed. Signing you out...",
      });
      setTimeout(onDone, 1200);
    } catch (err) {
      setMsg({ tone: "danger", text: errorMessage(err) });
      setBusy(false);
    }
  }

  return (
    <Card>
      <SectionTitle
        icon={KeyRound}
        title="Change password"
        subtitle="Update your account password"
      />
      <form
        onSubmit={submit}
        className="space-y-4 border-t border-border px-6 py-6"
      >
        {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
        <Input
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={oldPassword}
          onChange={(e) => setOld(e.target.value)}
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNew(e.target.value)}
            minLength={8}
            required
            hint="At least 8 characters"
          />
          <Input
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        <div className="flex justify-end pt-2">
          <Button type="submit" loading={busy} size="sm">
            Update password
          </Button>
        </div>
      </form>
    </Card>
  );
}

/* ─── Change Email ────────────────────────────────────────────────────── */

function ChangeEmailCard({
  currentEmail,
  onUpdated,
}: {
  currentEmail: string;
  onUpdated: (email: string) => void;
}) {
  const [step, setStep] = useState<"request" | "verify">("request");
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState<Feedback>(null);
  const [busy, setBusy] = useState(false);

  async function requestChange(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      await api("/user/email/change", {
        method: "POST",
        body: { newEmail },
      });
      setStep("verify");
      setMsg({ tone: "info", text: `Verification code sent to ${newEmail}` });
    } catch (err) {
      setMsg({ tone: "danger", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  async function verifyChange(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const res = await api<{ email: string }>("/user/email/change/verify", {
        method: "POST",
        body: { newEmail, otp },
      });
      onUpdated(res.email ?? newEmail);
      setStep("request");
      setNewEmail("");
      setOtp("");
      setMsg({ tone: "success", text: "Email updated successfully." });
    } catch (err) {
      setMsg({ tone: "danger", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <SectionTitle
        icon={Mail}
        title="Email address"
        subtitle={currentEmail}
      />
      {step === "request" ? (
        <form
          onSubmit={requestChange}
          className="space-y-4 border-t border-border px-6 py-6"
        >
          {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
          <Input
            label="New email address"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />
          <div className="flex justify-end pt-2">
            <Button type="submit" loading={busy} size="sm">
              <Mail className="size-4" /> Send verification code
            </Button>
          </div>
        </form>
      ) : (
        <form
          onSubmit={verifyChange}
          className="space-y-4 border-t border-border px-6 py-6"
        >
          {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
          <Input
            label="Verification code"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            required
            className="font-mono tracking-[0.3em]"
          />
          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setStep("request");
                setMsg(null);
              }}
            >
              Back
            </Button>
            <Button type="submit" loading={busy} size="sm">
              Verify & update
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

/* ─── Danger Zone ─────────────────────────────────────────────────────── */

function DangerZoneCard({ isOAuth, onDeleted }: { isOAuth: boolean; onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      await api("/user/account", {
        method: "DELETE",
        body: isOAuth ? { confirmText } : { password },
      });
      onDeleted();
    } catch (err) {
      setMsg(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Card className="border-danger/30">
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-danger/10">
          <Trash2 className="size-4 text-danger" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-danger">Danger zone</h2>
          <p className="text-sm text-text-faint">
            Irreversible actions
          </p>
        </div>
      </div>
      <div className="border-t border-danger/20 px-6 py-6">
        {!confirming ? (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-text">Delete account</p>
              <p className="text-sm text-text-faint">
                Permanently delete your account and all associated data.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirming(true)}
            >
              <Trash2 className="size-4" /> Delete
            </Button>
          </div>
        ) : (
          <form onSubmit={deleteAccount} className="space-y-4">
            {msg && <Alert tone="danger">{msg}</Alert>}
            <div className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3">
              <p className="text-sm text-danger">
                This action is permanent and cannot be undone. All your data,
                matches, and achievements will be deleted.
              </p>
            </div>
            {isOAuth ? (
              <Input
                label={<>Type <span className="font-mono font-bold text-danger">DELETE</span> to confirm</>}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                required
              />
            ) : (
              <Input
                label="Enter your password to confirm"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setConfirming(false);
                  setPassword("");
                  setConfirmText("");
                  setMsg(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="sm"
                loading={busy}
                disabled={isOAuth && confirmText !== "DELETE"}
              >
                Delete permanently
              </Button>
            </div>
          </form>
        )}
      </div>
    </Card>
  );
}
