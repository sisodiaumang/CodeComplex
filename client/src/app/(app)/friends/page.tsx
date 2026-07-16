"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Search, UserMinus, UserPlus, Users, X } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import {
  asUser,
  avatarUrl,
  unwrapList,
  type FriendRequest,
  type PublicUser,
} from "@/lib/types";
import { cn, countryFlag } from "@/lib/utils";
import { useAuth } from "@/stores/auth-store";
import {
  Alert,
  Avatar,
  Button,
  Card,
  EmptyState,
  Input,
  Skeleton,
  Spinner,
} from "@/components/ui";

type Tab = "friends" | "incoming" | "outgoing";

function PlayerListSkeleton() {
  return (
    <ul className="divide-y divide-border/60">
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i} className="flex items-center justify-between gap-2 px-5 py-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3.5 w-20" />
            </div>
          </div>
          <Skeleton className="h-8 w-20 rounded-md" />
        </li>
      ))}
    </ul>
  );
}

export default function FriendsPage() {
  const [tab, setTab] = useState<Tab>("friends");
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const me = useAuth((s) => s.user);

  const friendsQuery = useQuery({
    queryKey: ["friends"],
    queryFn: () => api<unknown>("/friends"),
  });

  const incomingQuery = useQuery({
    queryKey: ["friends", "incoming"],
    queryFn: () => api<unknown>("/friends/requests/incoming"),
  });

  const outgoingQuery = useQuery({
    queryKey: ["friends", "outgoing"],
    queryFn: () => api<unknown>("/friends/requests/outgoing"),
  });

  const searchQuery = useQuery({
    queryKey: ["friends", "search", search],
    queryFn: () =>
      api<unknown>(`/friends/search?q=${encodeURIComponent(search)}`),
    enabled: search.trim().length >= 2,
  });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ["friends"] });
  }

  const accept = useMutation({
    mutationFn: (id: string) =>
      api(`/friends/request/${id}/accept`, { method: "PATCH" }),
    onSuccess: invalidateAll,
    onError: (e) => setFeedback(errorMessage(e)),
  });

  const reject = useMutation({
    mutationFn: (id: string) =>
      api(`/friends/request/${id}/reject`, { method: "PATCH" }),
    onSuccess: invalidateAll,
    onError: (e) => setFeedback(errorMessage(e)),
  });

  const cancel = useMutation({
    mutationFn: (id: string) =>
      api(`/friends/request/${id}`, { method: "DELETE" }),
    onSuccess: invalidateAll,
    onError: (e) => setFeedback(errorMessage(e)),
  });

  const unfriend = useMutation({
    mutationFn: (id: string) => api(`/friends/${id}`, { method: "DELETE" }),
    onSuccess: invalidateAll,
    onError: (e) => setFeedback(errorMessage(e)),
  });

  const friends = unwrapList<PublicUser | FriendRequest>(
    friendsQuery.data,
    "friends",
    "accepted"
  );
  const incoming = unwrapList<FriendRequest>(
    incomingQuery.data,
    "requests",
    "incoming"
  );
  const outgoing = unwrapList<FriendRequest>(
    outgoingQuery.data,
    "requests",
    "outgoing"
  );
  const results = unwrapList<PublicUser>(searchQuery.data, "users", "results");

  const tabs: Array<{ id: Tab; label: string; count: number }> = [
    { id: "friends", label: "Friends", count: friends.length },
    { id: "incoming", label: "Incoming", count: incoming.length },
    { id: "outgoing", label: "Outgoing", count: outgoing.length },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-text">Friends</h1>

      {feedback && <Alert tone="danger">{feedback}</Alert>}

      {/* Search */}
      <Card>
        <div className="px-5 py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-faint" />
            <Input
              aria-label="Search players"
              placeholder="Search by username…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {search.trim().length >= 2 && (
          <div className="border-t border-border">
            {searchQuery.isLoading ? (
              <PlayerListSkeleton />
            ) : results.length === 0 ? (
              <p className="px-5 py-4 text-[15px] text-text-muted">
                No players match &ldquo;{search.trim()}&rdquo;.
              </p>
            ) : (
              <ul>
                {results
                  .filter((u) => u.username !== me?.username)
                  .map((u) => (
                    <li
                      key={u._id ?? u.username}
                      className="flex items-center justify-between gap-2 px-5 py-3 transition-colors hover:bg-surface-2"
                    >
                      <PlayerCell user={u} />
                      {u._id && (
                        <SendRequestButton
                          userId={u._id}
                          onDone={invalidateAll}
                          onError={(m) => setFeedback(m)}
                        />
                      )}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}
      </Card>

      {/* Tabs */}
      <div className="flex gap-2" role="tablist" aria-label="Friend lists">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg border px-3.5 py-1.5 text-[15px] font-medium transition-colors",
              tab === t.id
                ? "border-primary/40 bg-primary-subtle text-primary"
                : "border-border text-text-muted hover:border-border-strong hover:text-text"
            )}
          >
            {t.label}
            <span className="ml-1 font-mono">{t.count}</span>
          </button>
        ))}
      </div>

      <Card>
        {tab === "friends" &&
          (friendsQuery.isLoading ? (
            <PlayerListSkeleton />
          ) : friends.length === 0 ? (
            <EmptyState
              icon={<Users className="size-6" />}
              title="No friends yet"
              message="Search for players above and send your first request."
            />
          ) : (
            <ul className="divide-y divide-border">
              {friends.map((f, i) => {
                const user = resolveFriend(f, me?._id);
                if (!user) return null;
                return (
                  <li
                    key={user._id ?? user.username ?? i}
                    className="flex items-center justify-between gap-2 px-5 py-3 transition-colors hover:bg-surface-2"
                  >
                    <PlayerCell user={user} />
                    {user._id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => unfriend.mutate(user._id!)}
                        loading={unfriend.isPending}
                        aria-label={`Remove ${user.username}`}
                      >
                        <UserMinus className="size-3.5" /> Remove
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          ))}

        {tab === "incoming" &&
          (incomingQuery.isLoading ? (
            <PlayerListSkeleton />
          ) : incoming.length === 0 ? (
            <EmptyState
              icon={<UserPlus className="size-6" />}
              title="No incoming requests"
              message="Requests other players send you will show up here."
            />
          ) : (
            <ul className="divide-y divide-border">
              {incoming.map((r) => {
                const sender = asUser(r.sender);
                return (
                  <li
                    key={r._id}
                    className="flex items-center justify-between gap-2 px-5 py-3 transition-colors hover:bg-surface-2"
                  >
                    <PlayerCell user={sender ?? { username: "Unknown player" }} />
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => accept.mutate(r._id)}
                        loading={accept.isPending}
                      >
                        <Check className="size-3.5" /> Accept
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => reject.mutate(r._id)}
                        loading={reject.isPending}
                      >
                        <X className="size-3.5" /> Decline
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ))}

        {tab === "outgoing" &&
          (outgoingQuery.isLoading ? (
            <PlayerListSkeleton />
          ) : outgoing.length === 0 ? (
            <EmptyState
              icon={<UserPlus className="size-6" />}
              title="No outgoing requests"
              message="Requests you send will wait here until they're answered."
            />
          ) : (
            <ul className="divide-y divide-border">
              {outgoing.map((r) => {
                const receiver = asUser(r.receiver);
                return (
                  <li
                    key={r._id}
                    className="flex items-center justify-between gap-2 px-5 py-3 transition-colors hover:bg-surface-2"
                  >
                    <PlayerCell user={receiver ?? { username: "Unknown player" }} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancel.mutate(r._id)}
                      loading={cancel.isPending}
                    >
                      <X className="size-3.5" /> Cancel
                    </Button>
                  </li>
                );
              })}
            </ul>
          ))}
      </Card>
    </div>
  );
}

function resolveFriend(
  entry: PublicUser | FriendRequest,
  myId?: string
): PublicUser | null {
  if ("username" in entry && entry.username) return entry as PublicUser;
  const fr = entry as FriendRequest;
  const sender = asUser(fr.sender);
  const receiver = asUser(fr.receiver);
  if (myId) {
    if (sender && sender._id !== myId) return sender;
    if (receiver && receiver._id !== myId) return receiver;
  }
  return sender ?? receiver;
}

function PlayerCell({ user }: { user: PublicUser }) {
  const inner = (
    <span className="flex min-w-0 items-center gap-3">
      <Avatar src={avatarUrl(user.avatar)} name={user.username} size={32} />
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-medium text-text">
          {user.username}
          {user.country && (
            <span className="ml-1" title={user.country}>
              {countryFlag(user.country)}
            </span>
          )}
        </span>
        {user.fullName && (
          <span className="block truncate text-sm text-text-faint">
            {user.fullName}
          </span>
        )}
      </span>
    </span>
  );

  return user.username && user.username !== "Unknown player" ? (
    <Link href={`/profile/${user.username}`} className="min-w-0 hover:opacity-80">
      {inner}
    </Link>
  ) : (
    inner
  );
}

function SendRequestButton({
  userId,
  onDone,
  onError,
}: {
  userId: string;
  onDone: () => void;
  onError: (message: string) => void;
}) {
  const [sent, setSent] = useState(false);

  const send = useMutation({
    mutationFn: () => api(`/friends/request/${userId}`, { method: "POST" }),
    onSuccess: () => {
      setSent(true);
      onDone();
    },
    onError: (e) => onError(errorMessage(e)),
  });

  return sent ? (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-win">
      <Check className="size-4" /> Sent
    </span>
  ) : (
    <Button
      variant="outline"
      size="sm"
      onClick={() => send.mutate()}
      loading={send.isPending}
    >
      <UserPlus className="size-3.5" /> Add
    </Button>
  );
}
