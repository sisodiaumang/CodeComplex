"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { SOCKET_URL } from "@/lib/api";
import { useAuth } from "@/stores/auth-store";

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ["websocket", "polling"],
  autoConnect: false,
});

/**
 * Hook that maintains a single Socket.IO connection for the logged-in user.
 * Listens for `notification:new` and invalidates the notifications query
 * so the bell badge and notifications page update instantly.
 *
 * Mount this once in the app shell.
 */
export function useSocketNotifications() {
  const user = useAuth((s) => s.user);
  const status = useAuth((s) => s.status);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (status !== "authed" || !user) {
      // Clean up if user logs out
      if (socket.connected) {
        socket.disconnect();
      }
      return;
    }

    // Connect if not already connected
    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      console.log("[socket] connected", socket.id);
    };

    const handleDisconnect = (reason: string) => {
      console.log("[socket] disconnected:", reason);
    };

    const handleNewNotification = () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    };

    const handleFriendshipUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("notification:new", handleNewNotification);
    socket.on("friendship:update", handleFriendshipUpdate);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("notification:new", handleNewNotification);
      socket.off("friendship:update", handleFriendshipUpdate);
    };
  }, [status, user, queryClient]);
}
