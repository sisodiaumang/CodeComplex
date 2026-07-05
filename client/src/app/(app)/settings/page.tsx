"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Mail, Trash2 } from "lucide-react";
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

export default function SettingsPage() {
  const { user, setUser, patchUser } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [bio, setBio] = useState(user?.bio ?? "");
  const [country, setCountry] = useState(user?.country ?? "IN");
  const [profileMsg, setProfileMsg] = useState<Feedback>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);

  if (!user) return null;

  async function onAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarBusy(true);
    setProfileMsg(null);
    try {
      const form = new FormData();
      form.append("avatar", file);
      const res = await api<{ avatar: Me["avatar"] }>("/user/avatar", {
        method: "PATCH",
        body: form,
      });
      patchUser({ avatar: res.avatar });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setProfileMsg({ tone: "success", text: "Photo updated." });
    } catch (err) {
      setProfileMsg({ tone: "danger", text: errorMessage(err) });
    } finally {
      setAvatarBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function saveProfile() {
    setProfileBusy(true);
    setProfileMsg(null);
    try {
      if (bio !== (user!.bio ?? "")) {
        await api("/user/bio", { method: "PATCH", body: { bio } });
        patchUser({ bio });
      }
      if (country !== (user!.country ?? "")) {
        await api("/user/country", { method: "PATCH", body: { country } });
        patchUser({ country });
      }
      setProfileMsg({ tone: "success", text: "Saved." });
    } catch (err) {
      setProfileMsg({ tone: "danger", text: errorMessage(err) });
    } finally {
      setProfileBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-text">Settings</h1>

      {/* Profile */}
      <Card>
        <div className="px-6 py-5">
          <h2 className="text-lg font-semibold text-text">Profile</h2>
          <p className="text-sm text-text-faint">How other players see you</p>
        </div>
        <div className="space-y-5 border-t border-border px-6 py-6">
          {profileMsg && <Alert tone={profileMsg.tone}>{profileMsg.text}</Alert>}

          <div className="flex items-center gap-3">
            <Avatar src={avatarUrl(user.avatar)} name={user.username} size={56} />
            <div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileRef.current?.click()}
                loading={avatarBusy}
              >
                <Camera className="size-3.5" /> Change photo
              </Button>
              <p className="mt-1.5 text-sm text-text-faint">JPG or PNG, up to 5MB</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={onAvatarPick}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
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

          <div className="flex flex-col gap-1">
            <label htmlFor="bio" className="text-[15px] font-medium text-text-muted">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              maxLength={200}
              rows={2}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the arena who you are..."
              className="w-full resize-none rounded-lg border border-border bg-surface-2 px-4 py-3 text-[15px] text-text placeholder:text-text-faint focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            <p className="text-right text-sm text-text-faint">{bio.length}/200</p>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveProfile} loading={profileBusy} size="sm">
              Save changes
            </Button>
          </div>
        </div>
      </Card>

      <ChangePasswordCard onDone={() => forceRelogin(setUser, queryClient, router)} />
      <ChangeEmailCard currentEmail={user.email} onUpdated={(email) => patchUser({ email })} />
      <DangerZoneCard onDeleted={() => forceRelogin(setUser, queryClient, router)} />
    </div>
  );
}

type Feedback = { tone: "success" | "danger" | "info"; text: string } | null;

function forceRelogin(
  setUser: (u: Me | null) => void,
  queryClient: ReturnType<typeof useQueryClient>,
  router: ReturnType<typeof useRouter>
) {
  setUser(null);
  queryClient.clear();
  router.replace("/login");
}

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
      setMsg({ tone: "success", text: "Password changed. Signing you out..." });
      setTimeout(onDone, 1200);
    } catch (err) {
      setMsg({ tone: "danger", text: errorMessage(err) });
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="px-6 py-5">
        <h2 className="text-lg font-semibold text-text">Password</h2>
      </div>
      <form onSubmit={submit} className="space-y-4 border-t border-border px-6 py-6">
        {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
        <Input
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={oldPassword}
          onChange={(e) => setOld(e.target.value)}
          required
        />
        <div className="grid gap-3 sm:grid-cols-2">
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
            label="Confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={busy} size="sm">
            Update password
          </Button>
        </div>
      </form>
    </Card>
  );
}

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
      await api("/user/email/change", { method: "POST", body: { newEmail } });
      setStep("verify");
      setMsg({ tone: "info", text: `Code sent to ${newEmail}` });
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
      setMsg({ tone: "success", text: "Email updated." });
    } catch (err) {
      setMsg({ tone: "danger", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="px-6 py-5">
        <h2 className="text-lg font-semibold text-text">Email</h2>
        <p className="text-sm text-text-faint">{currentEmail}</p>
      </div>
      {step === "request" ? (
        <form onSubmit={requestChange} className="space-y-4 border-t border-border px-6 py-6">
          {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
          <Input
            label="New email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />
          <div className="flex justify-end">
            <Button type="submit" loading={busy} size="sm">
              <Mail className="size-3.5" /> Send code
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={verifyChange} className="space-y-4 border-t border-border px-6 py-6">
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
          <div className="flex justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setStep("request"); setMsg(null); }}
            >
              Back
            </Button>
            <Button type="submit" loading={busy} size="sm">
              Confirm
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

function DangerZoneCard({ onDeleted }: { onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      await api("/user/account", { method: "DELETE", body: { password } });
      onDeleted();
    } catch (err) {
      setMsg(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Card className="border-danger/20">
      <div className="px-6 py-5">
        <h2 className="text-lg font-semibold text-danger">Danger zone</h2>
      </div>
      <div className="border-t border-border px-6 py-6">
        {!confirming ? (
          <div className="flex items-center justify-between gap-4">
            <p className="text-[15px] text-text-muted">
              Permanently delete your account and all data.
            </p>
            <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
              <Trash2 className="size-3.5" /> Delete
            </Button>
          </div>
        ) : (
          <form onSubmit={deleteAccount} className="space-y-3">
            {msg && <Alert tone="danger">{msg}</Alert>}
            <p className="text-[15px] text-text-muted">
              Enter your password to confirm. This cannot be undone.
            </p>
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setConfirming(false); setPassword(""); setMsg(null); }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="danger" size="sm" loading={busy}>
                Delete permanently
              </Button>
            </div>
          </form>
        )}
      </div>
    </Card>
  );
}
