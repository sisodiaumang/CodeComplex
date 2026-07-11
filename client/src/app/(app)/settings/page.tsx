"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  KeyRound,
  Mail,
  Shield,
  Trash2,
  User,
  Check,
  Sparkles,
} from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { avatarUrl, type Me } from "@/lib/types";
import { COUNTRIES } from "@/lib/countries";
import { useAuth } from "@/stores/auth-store";
import KeyboardMascotAnimation from "@/components/KeyboardMascotAnimation";
import { cn, countryFlag } from "@/lib/utils";
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

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

const LeetcodeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M13.483 0a1.374 1.374 0 0 0-.961.414L.772 12.164a1.378 1.378 0 0 0 0 1.949l9.503 9.479a1.379 1.379 0 0 0 1.946 0l1.025-1.025a1.38 1.38 0 0 0 0-1.948l-8.503-8.5a.39.39 0 0 1 0-.549L12.52 5.758a1.378 1.378 0 0 0 0-1.948l-1.024-1.024a1.374 1.374 0 0 0-.961-.414z M16.1 13.91l-2.28 2.28a1.38 1.38 0 0 1-1.95 0l-4.1-4.1a1.38 1.38 0 0 1 0-1.95l2.28-2.28a1.38 1.38 0 0 1 1.95 0l4.1 4.1a1.38 1.38 0 0 1 0 1.95z M22.43 6.08a1.38 1.38 0 0 0-1.95 0l-10.14 10.14a1.38 1.38 0 0 0 0 1.95l.01.01a1.38 1.38 0 0 0 1.95 0l10.14-10.14a1.38 1.38 0 0 0 0-1.96z" />
  </svg>
);

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
    <div className="mx-auto max-w-5xl space-y-6 py-2">
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
  const [fullName, setFullName] = useState(user.fullName ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [country, setCountry] = useState(user.country ?? "IN");
  const [githubProfile, setGithubProfile] = useState(user.githubProfile ?? "");
  const [linkedinProfile, setLinkedinProfile] = useState(user.linkedinProfile ?? "");
  const [leetcodeProfile, setLeetcodeProfile] = useState(user.leetcodeProfile ?? "");
  const [msg, setMsg] = useState<Feedback>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);

  // Mascot customization states
  const [myPetType, setMyPetType] = useState("cat");
  const [myPetColor, setMyPetColor] = useState("#FF6B00");

  useEffect(() => {
    if (user?.mascot) {
      setMyPetType(user.mascot.type);
      setMyPetColor(user.mascot.color);
    } else if (typeof window !== "undefined") {
      setMyPetType(localStorage.getItem("mascot-type") ?? "cat");
      setMyPetColor(localStorage.getItem("mascot-color") ?? "#FF6B00");
    }
  }, [user?.mascot]);

  const savePetConfig = async (type: string, color: string) => {
    setMyPetType(type);
    setMyPetColor(color);
    if (typeof window !== "undefined") {
      localStorage.setItem("mascot-type", type);
      localStorage.setItem("mascot-color", color);
    }
    try {
      await api("/user/mascot", {
        method: "PATCH",
        body: { type, color },
      });
      patchUser({ mascot: { type, color } });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch (err) {
      console.error("Failed to save mascot:", err);
    }
  };

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
      if (fullName.trim() !== (user.fullName ?? "")) {
        await api("/user/fullname", { method: "PATCH", body: { fullName: fullName.trim() } });
        patchUser({ fullName: fullName.trim() });
      }
      if (bio.trim() !== (user.bio ?? "")) {
        await api("/user/bio", { method: "PATCH", body: { bio: bio.trim() } });
        patchUser({ bio: bio.trim() });
      }
      if (country !== (user.country ?? "")) {
        await api("/user/country", { method: "PATCH", body: { country } });
        patchUser({ country });
      }
      if (
        githubProfile.trim() !== (user.githubProfile ?? "") ||
        linkedinProfile.trim() !== (user.linkedinProfile ?? "") ||
        leetcodeProfile.trim() !== (user.leetcodeProfile ?? "")
      ) {
        await api("/user/socials", {
          method: "PATCH",
          body: {
            githubProfile: githubProfile.trim(),
            linkedinProfile: linkedinProfile.trim(),
            leetcodeProfile: leetcodeProfile.trim(),
          },
        });
        patchUser({
          githubProfile: githubProfile.trim(),
          linkedinProfile: linkedinProfile.trim(),
          leetcodeProfile: leetcodeProfile.trim(),
        });
      }
      setMsg({ tone: "success", text: "Profile saved." });
    } catch (err) {
      setMsg({ tone: "danger", text: errorMessage(err) });
    } finally {
      setSaveBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* Live Preview Card */}
      <div className="space-y-3">
        <label className="text-[15px] font-medium text-text-muted">Profile Preview</label>
        <Card className="overflow-hidden border border-border bg-surface shadow-md">
          {/* Card Header (Gradient background) */}
          <div className="h-16 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border relative overflow-hidden flex items-center justify-end px-4">
            <div className="scale-75 origin-bottom-right translate-y-3 opacity-90">
              <KeyboardMascotAnimation active={true} pet={{ type: myPetType, color: myPetColor }} onlyMascot={true} />
            </div>
          </div>
          
          <div className="relative -mt-10 flex flex-col items-center px-4 pb-6 text-center">
            {/* Avatar with edit overlay */}
            <div 
              onClick={() => fileRef.current?.click()}
              className="group relative cursor-pointer size-20 overflow-hidden rounded-full ring-4 ring-surface shadow-md transition-transform hover:scale-105"
            >
              <Avatar
                src={avatarUrl(user.avatar)}
                name={user.username}
                size={80}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="size-5 text-white" />
              </div>
              {avatarBusy && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}
            </div>

            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-center gap-1.5">
                <h3 className="font-semibold text-text text-base truncate max-w-[180px]">
                  {fullName.trim() || "Your Name"}
                </h3>
                {country && (
                  <span className="text-sm" title={country}>
                    {countryFlag(country)}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-faint">@{user.username}</p>
            </div>

            {/* Social Icons Preview */}
            {(githubProfile.trim() || linkedinProfile.trim() || leetcodeProfile.trim()) && (
              <div className="mt-3 flex gap-2.5">
                {githubProfile.trim() && (
                  <a
                    href={githubProfile.trim().startsWith("http") ? githubProfile.trim() : `https://${githubProfile.trim()}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex size-7 items-center justify-center rounded-full border border-border bg-surface-2 text-text-muted transition-colors hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                    title="GitHub Profile"
                  >
                    <GithubIcon className="size-4" />
                  </a>
                )}
                {leetcodeProfile.trim() && (
                  <a
                    href={leetcodeProfile.trim().startsWith("http") ? leetcodeProfile.trim() : `https://${leetcodeProfile.trim()}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex size-7 items-center justify-center rounded-full border border-border bg-surface-2 text-text-muted transition-colors hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                    title="LeetCode Profile"
                  >
                    <LeetcodeIcon className="size-4" />
                  </a>
                )}
                {linkedinProfile.trim() && (
                  <a
                    href={linkedinProfile.trim().startsWith("http") ? linkedinProfile.trim() : `https://${linkedinProfile.trim()}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex size-7 items-center justify-center rounded-full border border-border bg-surface-2 text-text-muted transition-colors hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                    title="LinkedIn Profile"
                  >
                    <LinkedinIcon className="size-4" />
                  </a>
                )}
              </div>
            )}

            {/* Bio Preview */}
            <div className="mt-4 w-full border-t border-border/60 pt-4 text-left">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Bio</p>
              <p className="mt-1 text-sm text-text-muted leading-relaxed break-words whitespace-pre-wrap min-h-[50px]">
                {bio.trim() || "Write something about yourself..."}
              </p>
            </div>
          </div>
        </Card>
        
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={onAvatarPick}
        />
      </div>

      {/* Edit Form */}
      <div className="space-y-5">
        <Card className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <h2 className="text-base font-semibold text-text">Edit Profile</h2>
              <p className="text-sm text-text-faint">Update your display name, location, socials, and bio</p>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {msg && (
              <Alert tone={msg.tone}>{msg.text}</Alert>
            )}

            {/* Avatar management row */}
            <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-border/40">
              <div 
                onClick={() => fileRef.current?.click()}
                className="group relative cursor-pointer size-16 overflow-hidden rounded-full ring-2 ring-primary/20 hover:scale-[1.02] active:scale-95 transition-all shadow-sm shrink-0"
              >
                <Avatar
                  src={avatarUrl(user.avatar)}
                  name={user.username}
                  size={64}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="size-4 text-white" />
                </div>
                {avatarBusy && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <div className="size-4.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                )}
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono">Profile Picture</h3>
                <p className="text-[11px] text-text-faint">PNG, JPG, or WebP. Max 2MB.</p>
                <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                    loading={avatarBusy}
                    className="h-7.5 text-[10px] font-semibold px-2.5"
                  >
                    <Camera className="size-3.5 mr-1" /> Change Avatar
                  </Button>
                </div>
              </div>
            </div>

            {/* Core Info Details */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
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

            {/* Social Links Details */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="GitHub Profile Link"
                placeholder="e.g. github.com/username"
                value={githubProfile}
                onChange={(e) => setGithubProfile(e.target.value)}
              />
              <Input
                label="LeetCode Profile Link"
                placeholder="e.g. leetcode.com/username"
                value={leetcodeProfile}
                onChange={(e) => setLeetcodeProfile(e.target.value)}
              />
              <Input
                label="LinkedIn Profile Link"
                placeholder="e.g. linkedin.com/in/username"
                value={linkedinProfile}
                onChange={(e) => setLinkedinProfile(e.target.value)}
              />
            </div>

            {/* Bio Input */}
            <div className="space-y-1.5">
              <label htmlFor="bio" className="text-xs font-semibold text-text uppercase tracking-wider font-mono">
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                maxLength={200}
                rows={4}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a brief, professional bio..."
                className="w-full resize-none rounded-lg border border-border bg-surface px-4 py-3 text-xs text-text placeholder:text-text-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
              />
              <p className="text-right text-[10px] text-text-faint font-mono">
                {bio.length}/200
              </p>
            </div>

            {/* Mascot Settings */}
            <div className="pt-6 border-t border-border/40 space-y-4">
              <div>
                <h3 className="text-xs font-black text-text uppercase tracking-widest font-mono flex items-center gap-2">
                  <Sparkles className="size-4 text-primary animate-pulse" />
                  Mascot Customization
                </h3>
                <p className="text-[11px] text-text-faint mt-1">Configure your personal typing mascot that other developers will see in battle rounds.</p>
              </div>

              <div className="grid gap-6 sm:grid-cols-[1fr_200px]">
                {/* Selectors and picks */}
                <div className="space-y-4">
                  {/* Select Mascot Type */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono">Select Animal Type</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { id: "cat", label: "Cat 🐱" },
                        { id: "dog", label: "Dog 🐶" },
                        { id: "panda", label: "Panda 🐼" },
                        { id: "crab", label: "Crab 🦀" },
                      ].map((petOpt) => (
                        <button
                          key={petOpt.id}
                          type="button"
                          onClick={() => savePetConfig(petOpt.id, myPetColor)}
                          className={cn(
                            "flex items-center justify-center py-2.5 px-3 rounded-lg border font-bold text-xs transition-all hover:scale-[1.01] active:scale-95 cursor-pointer",
                            myPetType === petOpt.id
                              ? "border-primary bg-primary/5 text-primary shadow-sm"
                              : "border-border bg-surface-2 text-text-muted hover:border-border-strong hover:text-text"
                          )}
                        >
                          {petOpt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Select Mascot Color */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono">Mascot Accent Color</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { hex: "#FF6B00", name: "Orange" },
                        { hex: "#3B82F6", name: "Blue" },
                        { hex: "#2DB55D", name: "Green" },
                        { hex: "#EF4444", name: "Red" },
                        { hex: "#A855F7", name: "Purple" },
                        { hex: "#06B6D4", name: "Cyan" },
                      ].map((colorOpt) => (
                        <button
                          key={colorOpt.hex}
                          type="button"
                          onClick={() => savePetConfig(myPetType, colorOpt.hex)}
                          className={cn(
                            "size-7 rounded-full border transition-all hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center",
                            myPetColor === colorOpt.hex
                              ? "border-text ring-2 ring-primary/45 ring-offset-2 ring-offset-surface scale-105"
                              : "border-transparent"
                          )}
                          style={{ backgroundColor: colorOpt.hex }}
                          title={colorOpt.name}
                        >
                          {myPetColor === colorOpt.hex && (
                            <Check className="size-3 text-white stroke-[3]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Local Preview box */}
                <div className="flex flex-col items-center justify-center p-4 border border-border bg-surface-2/65 rounded-xl gap-2 select-none">
                  <span className="text-[9px] text-text-faint font-semibold uppercase tracking-wider font-mono">Live Preview</span>
                  <div className="scale-110 origin-center py-1">
                    <KeyboardMascotAnimation active={true} pet={{ type: myPetType, color: myPetColor }} onlyMascot={true} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-border/40 pt-4">
              <Button onClick={saveProfile} loading={saveBusy} className="text-xs font-semibold h-8.5 px-4">
                Save Changes
              </Button>
            </div>
          </div>
        </Card>
      </div>
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
