"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Check,
  CheckCheck,
  Swords,
  Trophy,
  Trash2,
  UserPlus,
  Users,
  Award,
  Info,
  Play,
} from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import {
  unwrapList,
  type AppNotification,
  type NotificationType,
} from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Spinner,
} from "@/components/ui";

const ICONS: Record<NotificationType, typeof Bell> = {
  FRIEND_REQUEST: UserPlus,
  FRIEND_ACCEPTED: Users,
  ROOM_INVITE: Swords,
  MATCH_STARTED: Swords,
  MATCH_RESULT: Trophy,
  ACHIEVEMENT_UNLOCKED: Award,
  SYSTEM: Info,
};

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<unknown>("/notifications"),
  });

  const notifications = unwrapList<AppNotification>(query.data, "notifications");
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  const markRead = useMutation({
    mutationFn: (id: string) =>
      api(`/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: invalidate,
  });

  const markAll = useMutation({
    mutationFn: () => api("/notifications/read-all", { method: "PATCH" }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      api(`/notifications/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });

  const [joinError, setJoinError] = useState<string | null>(null);

  const joinRoom = useMutation({
    mutationFn: (roomCode: string) =>
      api(`/battle/${roomCode}/join`, { method: "POST", body: {} }),
    onSuccess: (_data, roomCode) => {
      router.push(`/battle/${roomCode}`);
    },
    onError: (err) => setJoinError(errorMessage(err)),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 font-mono text-sm font-normal text-text-faint">
              {unreadCount} unread
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAll.mutate()}
            loading={markAll.isPending}
          >
            <CheckCheck className="size-3.5" /> Mark all read
          </Button>
        )}
      </div>

      {markAll.isError && <Alert tone="danger">{errorMessage(markAll.error)}</Alert>}
      {joinError && <Alert tone="danger">{joinError}</Alert>}

      <Card>
        {query.isLoading ? (
          <Spinner />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<Bell className="size-6" />}
            title="Nothing here yet"
            message="Friend requests, match results and achievements will show up here."
          />
        ) : (
          <ul className="divide-y divide-border">
            {notifications.map((n) => {
              const Icon = ICONS[n.type] ?? Info;
              return (
                <li
                  key={n._id}
                  className={cn(
                    "flex items-start gap-3 px-5 py-4 transition-colors",
                    !n.isRead && "bg-primary-subtle/20"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                      n.isRead
                        ? "bg-surface-2 text-text-faint"
                        : "bg-primary-subtle text-primary"
                    )}
                  >
                    <Icon className="size-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium text-text">{n.title}</p>
                    <p className="text-sm text-text-muted">{n.message}</p>
                    <p className="mt-1 font-mono text-xs text-text-faint">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {n.type === "ROOM_INVITE" && n.metadata?.roomCode && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="h-7 px-2.5 text-xs"
                        onClick={() => {
                          if (!n.isRead) markRead.mutate(n._id);
                          joinRoom.mutate(n.metadata!.roomCode as string);
                        }}
                        loading={joinRoom.isPending}
                      >
                        <Play className="size-3" /> Join
                      </Button>
                    )}
                    {!n.isRead && (
                      <button
                        onClick={() => markRead.mutate(n._id)}
                        title="Mark as read"
                        aria-label="Mark as read"
                        className="rounded-md p-1.5 text-text-faint transition-colors hover:bg-surface-2 hover:text-primary"
                      >
                        <Check className="size-4" />
                      </button>
                    )}
                    <button
                      onClick={() => remove.mutate(n._id)}
                      title="Delete"
                      aria-label="Delete notification"
                      className="rounded-md p-1.5 text-text-faint transition-colors hover:bg-surface-2 hover:text-danger"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
