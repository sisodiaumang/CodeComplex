// ─── Shared API types (mirrors backendserver interfaces) ────────────────────

import type { BattleType } from "./theme";

export type { BattleType };

export interface ApiEnvelope<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

export interface Avatar {
  profileImageURL?: string;
  profileImagePublicId?: string;
}

export interface Me {
  _id: string;
  username: string;
  fullName?: string;
  email: string;
  avatar?: Avatar;
  bio?: string;
  country?: string;
  role?: "USER" | "ADMIN" | "MODERATOR" | "OWNER";
  isVerified?: boolean;
  oauthProvider?: "google" | "github";
  githubProfile?: string;
  linkedinProfile?: string;
  leetcodeProfile?: string;
  createdAt?: string;
  mascot?: {
    type: string;
    color: string;
  };
}

export interface UserProfileData {
  ratings: RatingsMap;
  peakRatings: RatingsMap;
  stats: ProfileStats;
  streak: number;
  badges: any[];
  achievements: any[];
}

export interface PublicUser {
  _id?: string;
  username: string;
  fullName?: string;
  avatar?: Avatar | string;
  bio?: string;
  country?: string;
  githubProfile?: string;
  linkedinProfile?: string;
  leetcodeProfile?: string;
  createdAt?: string;
  memberSince?: string;
  profileData?: UserProfileData;
  mascot?: {
    type: string;
    color: string;
  };
}

export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type RoomStatus = "WAITING" | "STARTED" | "FINISHED" | "CANCELLED";
export type MatchStatus = "ONGOING" | "COMPLETED" | "ABANDONED";
export type MatchType = "RANKED" | "CASUAL" | "FRIEND" | "TOURNAMENT";

/** A room member may arrive populated or as a bare ObjectId string. */
export type RoomMember = PublicUser | string;

export interface BattleRoom {
  _id: string;
  roomCode: string;
  host: RoomMember;
  battleType: BattleType;
  topics?: string[];
  difficulty?: Difficulty;
  teamSize: number;
  status: RoomStatus;
  questionSlug?: string;
  matchId?: string;
  isRanked?: boolean;
  isSolo?: boolean;
  teams: {
    teamA: RoomMember[];
    teamB: RoomMember[];
  };
  createdAt?: string;
}

export interface Match {
  _id: string;
  battleRoomId?: string;
  questionSlug?: string;
  battleType: BattleType;
  teamA: RoomMember[];
  teamB: RoomMember[];
  winnerTeam?: "A" | "B" | "DRAW";
  startedAt?: string;
  endedAt?: string;
  durationInMinutes?: number;
  status: MatchStatus;
  teamAScore?: number;
  teamBScore?: number;
  matchType?: MatchType;
  difficulty?: Difficulty;
  createdAt?: string;
}

export interface RatingsMap {
  dsa: number;
  frontend: number;
  backend: number;
  fullstack: number;
  promptWar: number;
  team: number;
}

export interface ProfileStats {
  wins: number;
  losses: number;
  draws: number;
  totalMatches: number;
  dsaSolved?: number;
  frontendCompleted?: number;
  backendCompleted?: number;
  fullstackCompleted?: number;
}

export interface LeaderboardPlayer {
  rank: number;
  username?: string;
  avatar?: string;
  country?: string;
  rating: number;
  wins?: number;
  losses?: number;
}

export interface LeaderboardPage {
  players: LeaderboardPlayer[];
  page?: number;
  totalPages?: number;
  total?: number;
}

export type NotificationType =
  | "FRIEND_REQUEST"
  | "FRIEND_ACCEPTED"
  | "ROOM_INVITE"
  | "MATCH_STARTED"
  | "MATCH_RESULT"
  | "ACHIEVEMENT_UNLOCKED"
  | "SYSTEM";

export interface AppNotification {
  _id: string;
  sender?: PublicUser | string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type AchievementRarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

export interface Achievement {
  _id: string;
  name: string;
  description: string;
  rarity: AchievementRarity;
  icon?: string;
  category?: string;
  requirement?: number;
  xpReward?: number;
  unlockedAt?: string;
}

export type FriendshipStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "BLOCKED";

export interface FriendRequest {
  _id: string;
  sender: PublicUser | string;
  receiver: PublicUser | string;
  status: FriendshipStatus;
  createdAt?: string;
}

// ─── Helpers for defensively unwrapping list payloads ────────────────────────

/**
 * Backend endpoints sometimes return a bare array and sometimes wrap it
 * ({ matches: [...] }, { friends: [...] } …). This normalises both shapes.
 */
export function unwrapList<T>(data: unknown, ...keys: string[]): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    for (const key of keys) {
      const v = (data as Record<string, unknown>)[key];
      if (Array.isArray(v)) return v as T[];
    }
    // fall back to the first array value found
    for (const v of Object.values(data as Record<string, unknown>)) {
      if (Array.isArray(v)) return v as T[];
    }
  }
  return [];
}

/** Extracts a populated user from a member that may be a bare id string. */
export function asUser(member: RoomMember | undefined | null): PublicUser | null {
  if (!member || typeof member === "string") return null;
  return member;
}

export function avatarUrl(avatar?: Avatar | string): string | undefined {
  if (!avatar) return undefined;
  if (typeof avatar === "string") return avatar;
  return avatar.profileImageURL || undefined;
}
