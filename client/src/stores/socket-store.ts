"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { SOCKET_URL } from "@/lib/api";
import { useAuth } from "@/stores/auth-store";

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
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !user) {
      // Clean up if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Already connected
    if (socketRef.current?.connected) return;

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("[socket] connected", socket.id);
    });

    socket.on("notification:new", () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    socket.on("disconnect", (reason) => {
      console.log("[socket] disconnected:", reason);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [status, user, queryClient]);
}
