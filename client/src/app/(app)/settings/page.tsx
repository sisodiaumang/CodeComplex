"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Camera,
  KeyRound,
  Mail,
  Shield,
  Trash2,
  User,
  Check,
  Sparkles,
  Lock,
} from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { avatarUrl, type Me, type Achievement } from "@/lib/types";
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

const ALL_PETS_LIST = [
  { id: "cat", label: "Byte Kitten", rarity: "COMMON", source: "First Blood Achievement" },
  { id: "dog", label: "Debug Puppy", rarity: "COMMON", source: "First Win Achievement" },
  { id: "hamster", label: "Hamster Thread", rarity: "COMMON", source: "Rising Gladiator Achievement" },
  { id: "crab", label: "Rusty Crab", rarity: "COMMON", source: "Victorious Achievement" },
  { id: "panda", label: "Panda Cub", rarity: "COMMON", source: "Battle Hardened Achievement" },
  { id: "octopus", label: "Octo-Junior", rarity: "COMMON", source: "10 Victories Achievement" },
  { id: "frog", label: "Ping Frog", rarity: "COMMON", source: "Getting Warm Achievement" },
  { id: "bunny", label: "Git Bunny", rarity: "COMMON", source: "Hot Streak Achievement" },
  { id: "turtle", label: "Shell Turtle", rarity: "COMMON", source: "On Fire Achievement" },
  { id: "koala", label: "Null Koala", rarity: "COMMON", source: "Novice Challenger Achievement" },
  { id: "fox", label: "Regex Fox", rarity: "RARE", source: "Rising Star Achievement" },
  { id: "owl", label: "Stack Owl", rarity: "RARE", source: "Elite Competitor Achievement" },
  { id: "squirrel", label: "Cache Squirrel", rarity: "RARE", source: "Expert Achievement" },
  { id: "badger", label: "Bit Badger", rarity: "RARE", source: "Master Achievement" },
  { id: "sloth", label: "Token Sloth", rarity: "RARE", source: "DSA Starter Achievement" },
  { id: "dino", label: "Dino Compiler", rarity: "RARE", source: "Problem Solver Achievement" },
  { id: "whale", label: "Docker Whale", rarity: "RARE", source: "Algorithm Ace Achievement" },
  { id: "otter", label: "Web Otter", rarity: "RARE", source: "Logic Wizard Achievement" },
  { id: "monkey", label: "Cyber Monkey", rarity: "EPIC", source: "Prompt Novice Achievement" },
  { id: "quantum_cat", label: "Quantum Cat", rarity: "EPIC", source: "Prompt Warrior Achievement" },
  { id: "dolphin", label: "API Dolphin", rarity: "EPIC", source: "Prompt Commander Achievement" },
  { id: "lion", label: "Firewall Lion", rarity: "EPIC", source: "AI Whisperer Achievement" },
  { id: "raccoon", label: "Kernel Raccoon", rarity: "EPIC", source: "Prompt Master Achievement" },
  { id: "parrot", label: "Prompt Parrot", rarity: "EPIC", source: "Frontend Learner Achievement" },
  { id: "snake", label: "Syntax Snake", rarity: "EPIC", source: "Backend Learner Achievement" },
  { id: "phoenix", label: "Phoenix", rarity: "LEGENDARY", source: "Unstoppable Achievement" },
  { id: "dragon", label: "Code Dragon", rarity: "LEGENDARY", source: "Legendary Coder Achievement" },
  { id: "unicorn", label: "Byte Unicorn", rarity: "LEGENDARY", source: "Algorithm Overlord Achievement" },
  { id: "cyber_fox", label: "AI Cyber-Fox", rarity: "LEGENDARY", source: "Prompt Legend Achievement" },
  { id: "robo_puppy", label: "Polymer Robo-Puppy", rarity: "LEGENDARY", source: "Projects Titan Achievement" },
];

const BANNER_CLASSES: Record<string, string> = {
  apprentice: "bg-slate-950 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:10px_10px] border-slate-800 text-slate-400",
  novice: "bg-blue-950 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] bg-[size:8px_8px] border-blue-900 text-blue-400",
  bug_hunter: "bg-emerald-950 bg-[linear-gradient(45deg,#064e3b_25%,transparent_25%),linear-gradient(-45deg,#064e3b_25%,transparent_25%)] bg-[size:6px_6px] border-emerald-900 text-emerald-400",
  explorer: "bg-indigo-950 bg-[repeating-linear-gradient(45deg,#312e81,#312e81_4px,transparent_4px,transparent_8px)] border-indigo-900/60 text-indigo-400",
  architect: "bg-zinc-900 bg-[linear-gradient(to_bottom,transparent_95%,#0891b2_95%)] bg-[size:100%_12px] border-cyan-900/60 text-cyan-400",
  overlord: "bg-rose-950 bg-[repeating-linear-gradient(-45deg,#991b1b,#991b1b_2px,transparent_2px,transparent_8px)] border-rose-900/60 text-rose-400",
  slinger: "bg-neutral-950 bg-[radial-gradient(#9d174d_1.2px,transparent_1.2px)] bg-[size:12px_12px] border-pink-900/50 text-pink-400",
  stack_overlord: "bg-stone-900 bg-[linear-gradient(27deg,#1c1917_25%,transparent_25%),linear-gradient(207deg,#1c1917_25%,transparent_25%)] bg-[size:8px_8px] border-amber-900/60 text-amber-400",
  cyber_sentient: "bg-stone-950 bg-[linear-gradient(to_right,#5b21b6_0.5px,transparent_0.5px),linear-gradient(to_bottom,#5b21b6_0.5px,transparent_0.5px)] bg-[size:16px_16px] border-violet-900/60 text-violet-400",
  grandmaster: "bg-black bg-[radial-gradient(#d97706_0.8px,transparent_0.8px)] bg-[size:14px_14px] border-amber-500/30 text-amber-500",
  void_walker: "bg-violet-950 bg-[radial-gradient(#c084fc_1px,transparent_1px)] bg-[size:20px_20px] border-purple-900/60 text-purple-400",
  stellar_monarch: "bg-slate-950 bg-[radial-gradient(#fcd34d_0.8px,transparent_0.8px)] bg-[size:16px_16px] border-amber-600/40 text-amber-300",
  binary_beast: "bg-black bg-[linear-gradient(to_bottom,rgba(16,185,129,0.1)_50%,transparent_50%)] bg-[size:100%_4px] border-emerald-900/50 text-emerald-400",
  quantum_specter: "bg-cyan-950 bg-[repeating-linear-gradient(135deg,#0e7490,#0e7490_3px,transparent_3px,transparent_12px)] border-cyan-800/50 text-cyan-400",
  neon_shogun: "bg-neutral-950 bg-[linear-gradient(115deg,#701a75_10%,transparent_10%),linear-gradient(295deg,#701a75_10%,transparent_10%)] bg-[size:12px_12px] border-fuchsia-900/60 text-fuchsia-400",
  apex_predator: "bg-red-950 bg-[radial-gradient(#dc2626_1.2px,transparent_1.2px)] bg-[size:18px_18px] border-red-800/60 text-red-400",
  shadow_agent: "bg-zinc-950 bg-[linear-gradient(to_right,#3f3f46_1px,transparent_1px),linear-gradient(to_bottom,#3f3f46_1px,transparent_1px)] bg-[size:14px_14px] border-zinc-800 text-zinc-400",
  solar_flare: "bg-amber-950 bg-[radial-gradient(#f97316_1px,transparent_1px)] bg-[size:10px_10px] border-orange-950/60 text-orange-400",
  abyss_watcher: "bg-slate-900 bg-[repeating-linear-gradient(45deg,#1e293b,#1e293b_10px,#0f172a_10px,#0f172a_20px)] border-slate-800/80 text-slate-300",
  celestial_deity: "bg-slate-950 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px),radial-gradient(#fbbf24_1px,transparent_1px)] bg-[size:24px_24px] border-slate-700/50 text-amber-200",
};

const ALL_BANNERS_LIST = [
  { id: "apprentice", name: "Apprentice Coder", reqLevel: 1, class: BANNER_CLASSES.apprentice },
  { id: "novice", name: "Syntax Novice", reqLevel: 2, class: BANNER_CLASSES.novice },
  { id: "bug_hunter", name: "Bug Hunter", reqLevel: 3, class: BANNER_CLASSES.bug_hunter },
  { id: "explorer", name: "Algorithm Explorer", reqLevel: 4, class: BANNER_CLASSES.explorer },
  { id: "architect", name: "System Architect", reqLevel: 5, class: BANNER_CLASSES.architect },
  { id: "overlord", name: "API Overlord", reqLevel: 6, class: BANNER_CLASSES.overlord },
  { id: "slinger", name: "Prompt Slinger", reqLevel: 7, class: BANNER_CLASSES.slinger },
  { id: "stack_overlord", name: "Stack Overlord", reqLevel: 8, class: BANNER_CLASSES.stack_overlord },
  { id: "cyber_sentient", name: "Cyber Sentient", reqLevel: 9, class: BANNER_CLASSES.cyber_sentient },
  { id: "grandmaster", name: "Grandmaster", reqLevel: 10, class: BANNER_CLASSES.grandmaster },
  { id: "void_walker", name: "Void Walker", reqLevel: 11, class: BANNER_CLASSES.void_walker },
  { id: "stellar_monarch", name: "Stellar Monarch", reqLevel: 12, class: BANNER_CLASSES.stellar_monarch },
  { id: "binary_beast", name: "Binary Beast", reqLevel: 13, class: BANNER_CLASSES.binary_beast },
  { id: "quantum_specter", name: "Quantum Specter", reqLevel: 14, class: BANNER_CLASSES.quantum_specter },
  { id: "neon_shogun", name: "Neon Shogun", reqLevel: 15, class: BANNER_CLASSES.neon_shogun },
  { id: "apex_predator", name: "Apex Predator", reqLevel: 16, class: BANNER_CLASSES.apex_predator },
  { id: "shadow_agent", name: "Shadow Agent", reqLevel: 17, class: BANNER_CLASSES.shadow_agent },
  { id: "solar_flare", name: "Solar Flare", reqLevel: 18, class: BANNER_CLASSES.solar_flare },
  { id: "abyss_watcher", name: "Abyss Watcher", reqLevel: 19, class: BANNER_CLASSES.abyss_watcher },
  { id: "celestial_deity", name: "Celestial Deity", reqLevel: 20, class: BANNER_CLASSES.celestial_deity },
];

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

  // Mascot and banner customization states
  const [myPetType, setMyPetType] = useState("cat");
  const [myPetColor, setMyPetColor] = useState("#FF6B00");
  const [myBanner, setMyBanner] = useState("apprentice");

  // Fetch achievements to calculate XP and unlocked status
  const achievementsQuery = useQuery({
    queryKey: ["achievements"],
    queryFn: () => api<Achievement[]>("/achievements"),
  });

  const achievements = achievementsQuery.data ?? [];
  const totalXp = achievements.filter((a) => a.unlocked).reduce((sum, a) => sum + (a.xpReward ?? 0), 0);
  const currentLevel = Math.floor(totalXp / 1000) + 1;

  const unlockedPetTypes = new Set([
    "cat", "dog", "panda", "crab",
    ...achievements.filter((a) => a.unlocked && a.mascotReward).map((a) => a.mascotReward!.type)
  ]);

  useEffect(() => {
    if (user?.mascot) {
      setMyPetType(user.mascot.type);
      setMyPetColor(user.mascot.color);
    } else if (typeof window !== "undefined") {
      setMyPetType(localStorage.getItem("mascot-type") ?? "cat");
      setMyPetColor(localStorage.getItem("mascot-color") ?? "#FF6B00");
    }
  }, [user?.mascot]);

  useEffect(() => {
    if (user?.banner) {
      setMyBanner(user.banner);
    }
  }, [user?.banner]);

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

  const saveBannerConfig = async (bannerId: string) => {
    setMyBanner(bannerId);
    try {
      await api("/user/banner", {
        method: "PATCH",
        body: { banner: bannerId },
      });
      patchUser({ banner: bannerId });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch (err) {
      console.error("Failed to save banner:", err);
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
      <div className="space-y-3 w-full max-w-md mx-auto lg:max-w-none lg:mx-0">
        <label className="text-[15px] font-medium text-text-muted">Profile Preview</label>
        <Card className="overflow-hidden border border-border bg-surface shadow-md">
          {/* Card Header */}
          <div className={cn(
            "h-16 border-b relative overflow-hidden flex items-center justify-end px-4",
            BANNER_CLASSES[myBanner] || "bg-slate-900 border-slate-800 text-slate-400"
          )}>
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
                  <Sparkles className="size-4 text-primary" />
                  Mascot Customization
                </h3>
                <p className="text-[11px] text-text-faint mt-1">
                  Configure your typing mascot. Unlock more by completing achievements! (Level {currentLevel} • {totalXp} XP)
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-[1fr_180px]">
                {/* Selectors and picks */}
                <div className="space-y-4">
                  {/* Select Mascot Type */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono">Select Animal ({ALL_PETS_LIST.filter(p => unlockedPetTypes.has(p.id)).length}/30 Unlocked)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1.5 border border-border/30 rounded-lg p-2 bg-surface-2/40 scrollbar-thin">
                      {ALL_PETS_LIST.map((petOpt) => {
                        const isUnlocked = unlockedPetTypes.has(petOpt.id);
                        const isSelected = myPetType === petOpt.id;

                        // Rarity styling mapping
                        let borderClass = "border-border";
                        let textClass = "text-text-muted";
                        let rarityLabel = "Common";
                        
                        if (petOpt.rarity === "RARE") {
                          borderClass = "border-blue-500/25";
                          textClass = "text-blue-400/90";
                          rarityLabel = "Rare";
                        } else if (petOpt.rarity === "EPIC") {
                          borderClass = "border-purple-500/25";
                          textClass = "text-purple-400/90";
                          rarityLabel = "Epic";
                        } else if (petOpt.rarity === "LEGENDARY") {
                          borderClass = "border-amber-500/30";
                          textClass = "text-amber-400";
                          rarityLabel = "Legendary";
                        }

                        return (
                          <button
                            key={petOpt.id}
                            type="button"
                            disabled={!isUnlocked}
                            onClick={() => savePetConfig(petOpt.id, myPetColor)}
                            className={cn(
                              "flex flex-col items-start p-2 rounded-lg border text-left transition-all relative overflow-hidden select-none",
                              isUnlocked ? "hover:scale-[1.01] cursor-pointer" : "opacity-40 cursor-not-allowed bg-surface-3/30",
                              isSelected
                                ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30"
                                : cn("bg-surface", borderClass)
                            )}
                            title={isUnlocked ? petOpt.source : `Locked: Requires "${petOpt.source.replace(" Achievement", "")}"`}
                          >
                            <span className="text-xs font-bold truncate w-full flex items-center justify-between gap-1">
                              {petOpt.label}
                              {!isUnlocked && <Lock className="size-2.5 text-text-faint shrink-0" />}
                            </span>
                            <span className={cn("text-[9px] uppercase font-bold font-mono tracking-wider mt-0.5", textClass)}>
                              {rarityLabel}
                            </span>
                          </button>
                        );
                      })}
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
                        { hex: "#F59E0B", name: "Gold" },
                        { hex: "#EC4899", name: "Pink" },
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
                <div className="flex flex-col items-center justify-center p-4 border border-border bg-surface-2/65 rounded-xl gap-2 select-none h-fit self-center">
                  <span className="text-[9px] text-text-faint font-semibold uppercase tracking-wider font-mono">Live Preview</span>
                  <div className="scale-110 origin-center py-1">
                    <KeyboardMascotAnimation active={true} pet={{ type: myPetType, color: myPetColor }} onlyMascot={true} />
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Banner Settings */}
            <div className="pt-6 border-t border-border/40 space-y-4">
              <div>
                <h3 className="text-xs font-black text-text uppercase tracking-widest font-mono flex items-center gap-2">
                  <User className="size-4 text-primary" />
                  Profile Banner Customization
                </h3>
                <p className="text-[11px] text-text-faint mt-1">
                  Select a custom background banner for your profile card based on your XP level.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 max-h-[220px] overflow-y-auto pr-1.5 p-1 scrollbar-thin">
                {ALL_BANNERS_LIST.map((bannerOpt) => {
                  const isUnlocked = currentLevel >= bannerOpt.reqLevel;
                  const isSelected = myBanner === bannerOpt.id;

                  return (
                    <button
                      key={bannerOpt.id}
                      type="button"
                      disabled={!isUnlocked}
                      onClick={() => saveBannerConfig(bannerOpt.id)}
                      className={cn(
                        "relative flex flex-col items-start p-3.5 rounded-lg border text-left transition-all overflow-hidden select-none bg-gradient-to-r",
                        bannerOpt.class,
                        isUnlocked ? "hover:scale-[1.01] cursor-pointer" : "opacity-35 cursor-not-allowed",
                        isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-surface scale-[1.01]" : ""
                      )}
                    >
                      <div className="flex w-full items-center justify-between z-10">
                        <span className="text-xs font-black font-mono tracking-wide uppercase drop-shadow">
                          {bannerOpt.name}
                        </span>
                        {isSelected && <Check className="size-3.5 stroke-[3] drop-shadow" />}
                        {!isUnlocked && <Lock className="size-3 text-text-faint shrink-0" />}
                      </div>
                      <span className="text-[9px] font-semibold font-mono tracking-wider mt-1 opacity-80 z-10 drop-shadow">
                        {isUnlocked ? "Unlocked" : `Requires Level ${bannerOpt.reqLevel}`}
                      </span>
                    </button>
                  );
                })}
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
