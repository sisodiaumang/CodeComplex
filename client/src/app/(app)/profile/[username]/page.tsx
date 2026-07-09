"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, CalendarDays, Pencil } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  avatarUrl,
  unwrapList,
  type Achievement,
  type PublicUser,
  type RatingsMap,
} from "@/lib/types";
import { MODE_COLORS, type BattleType } from "@/lib/theme";
import { cn, countryFlag, formatDate } from "@/lib/utils";
import { useAuth } from "@/stores/auth-store";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Spinner,
  TierBadge,
} from "@/components/ui";

const RATING_KEYS: Array<{ key: keyof RatingsMap; mode: BattleType }> = [
  { key: "dsa", mode: "DSA" },
  { key: "frontend", mode: "FRONTEND" },
  { key: "backend", mode: "BACKEND" },
  { key: "fullstack", mode: "FULLSTACK" },
  { key: "promptWar", mode: "PROMPT_WAR" },
];

function normalizeRatings(data: unknown): Partial<RatingsMap> {
  if (!data || typeof data !== "object") return {};
  const obj = data as Record<string, unknown>;
  const source =
    obj.ratings && typeof obj.ratings === "object"
      ? (obj.ratings as Record<string, unknown>)
      : obj;
  const out: Partial<RatingsMap> = {};
  for (const { key } of RATING_KEYS) {
    const v = source[key];
    if (typeof v === "number") out[key] = v;
  }
  return out;
}

const RARITY_STYLES: Record<string, string> = {
  COMMON: "border-border text-text-muted",
  RARE: "border-info/30 text-info",
  EPIC: "border-mode-promptwar/30 text-mode-promptwar",
  LEGENDARY: "border-draw/30 text-draw",
};

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const me = useAuth((s) => s.user);
  const isMe = me?.username?.toLowerCase() === username.toLowerCase();

  const profileQuery = useQuery({
    queryKey: ["profile", username],
    queryFn: () => api<PublicUser>(`/user/${username}`),
  });

  const ratingsQuery = useQuery({
    queryKey: ["ratings", username],
    queryFn: () =>
      api<unknown>(
        isMe ? "/ratings/me" : `/ratings/user/${username}`
      ).catch(() => null),
  });

  const achievementsQuery = useQuery({
    queryKey: ["achievements", username],
    queryFn: () =>
      api<unknown>(
        isMe ? "/achievements/me" : `/achievements/user/${username}`
      ).catch(() => null),
  });

  if (profileQuery.isLoading) return <Spinner />;

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <EmptyState
        title="Player not found"
        message={`No profile for "${username}".`}
      />
    );
  }

  const profile = profileQuery.data;
  const ratings = normalizeRatings(ratingsQuery.data);
  const achievements = unwrapList<Achievement>(
    achievementsQuery.data,
    "achievements",
    "unlocked"
  );

  const best = Math.max(
    1200,
    ...Object.values(ratings).filter((v): v is number => typeof v === "number")
  );

  return (
    <div className="space-y-6">
      {/* Identity */}
      <Card>
        <div className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              src={avatarUrl(profile.avatar)}
              name={profile.username}
              size={56}
            />
            <div>
              <h1 className="flex items-center gap-2 text-xl font-semibold text-text">
                {profile.username}
                {profile.country && (
                  <span className="text-base" title={profile.country}>{countryFlag(profile.country)}</span>
                )}
              </h1>
              {profile.fullName && (
                <p className="text-sm text-text-muted">{profile.fullName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <TierBadge rating={best} />
            <span className="flex items-center gap-1.5 text-sm text-text-faint">
              <CalendarDays className="size-4" />
              {formatDate(profile.createdAt)}
            </span>
            {isMe && (
              <Link href="/settings">
                <Button variant="outline" size="sm">
                  <Pencil className="size-3.5" /> Edit Profile
                </Button>
              </Link>
            )}
          </div>
        </div>
        {profile.bio && (
          <p className="border-t border-border px-6 py-4 text-[15px] text-text-muted">
            {profile.bio}
          </p>
        )}
      </Card>

      {/* Ratings */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {RATING_KEYS.map(({ key, mode }) => {
          const rating = ratings[key];
          const color = MODE_COLORS[mode];
          return (
            <div
              key={key}
              className="rounded-xl border border-border bg-surface px-5 py-4"
            >
              <div className="flex items-center gap-2 text-sm text-text-faint">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: color.accent }}
                />
                {color.label}
              </div>
              <p className="mt-2 font-mono text-2xl font-semibold text-text">
                {ratingsQuery.isLoading ? "—" : rating ?? "—"}
              </p>
              {typeof rating === "number" && (
                <TierBadge rating={rating} showRating={false} className="mt-0.5" />
              )}
            </div>
          );
        })}
      </div>

      {/* Achievements */}
      <Card>
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="text-lg font-semibold text-text">Achievements</h2>
          {achievements.length > 0 && (
            <span className="text-sm text-text-faint">{achievements.length} unlocked</span>
          )}
        </div>
        {achievementsQuery.isLoading ? (
          <Spinner />
        ) : achievements.length === 0 ? (
          <EmptyState
            icon={<Award className="size-6" />}
            title="Nothing unlocked yet"
            message={
              isMe
                ? "Win matches and climb tiers to earn achievements."
                : `${profile.username} hasn't unlocked any yet.`
            }
          />
        ) : (
          <div className="grid gap-3 border-t border-border p-6 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((a) => (
              <div
                key={a._id ?? a.name}
                className={cn(
                  "rounded-xl border bg-surface-2 px-5 py-4",
                  RARITY_STYLES[a.rarity] ?? RARITY_STYLES.COMMON
                )}
              >
                <p className="text-[15px] font-medium text-text">
                  {a.icon || ""} {a.name}
                </p>
                <p className="mt-1 text-sm text-text-muted">{a.description}</p>
                <p className="mt-2 font-mono text-xs text-text-faint">
                  {a.rarity}{a.xpReward ? ` · ${a.xpReward} XP` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
