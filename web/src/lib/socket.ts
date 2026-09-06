import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export type SocketStatus = "connected" | "connecting" | "disconnected";

export const getSocket = (): Socket => {
  if (!socket && typeof window !== "undefined") {
    let url = process.env.NEXT_PUBLIC_SOCKET_URL;

    // If no socket URL configured, or if env was set to localhost but browser is on a custom domain / IP:
    const isBrowserOnLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (!url || (!isBrowserOnLocalhost && url.includes("localhost"))) {
      url = `${window.location.protocol}//${window.location.hostname}:4000`;
    }

    socket = io(url, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("[Socket.io] Connected to server:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket.io] Disconnected:", reason);
    });
  }

  if (socket && !socket.connected && typeof window !== "undefined") {
    socket.connect();
  }

  return socket as Socket;
};

export const reconnectSocket = () => {
  if (typeof window !== "undefined") {
    const s = getSocket();
    if (!s.connected) {
      s.connect();
    }
  }
};

export const useSocketStatus = (): {
  status: SocketStatus;
  reconnect: () => void;
} => {
  const [status, setStatus] = useState<SocketStatus>(() => {
    if (typeof window === "undefined" || !socket) return "connecting";
    return socket.connected ? "connected" : "connecting";
  });

  const handleReconnect = useCallback(() => {
    setStatus("connecting");
    reconnectSocket();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const s = getSocket();

    const onConnect = () => setStatus("connected");
    const onDisconnect = () => setStatus("disconnected");
    const onConnectError = () => setStatus("disconnected");
    const onReconnectAttempt = () => setStatus("connecting");

    // Set immediate status
    if (s.connected) {
      setStatus("connected");
    } else {
      setStatus("connecting");
    }

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("connect_error", onConnectError);
    s.io.on("reconnect_attempt", onReconnectAttempt);

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("connect_error", onConnectError);
      s.io.off("reconnect_attempt", onReconnectAttempt);
    };
  }, []);

  return { status, reconnect: handleReconnect };
};

