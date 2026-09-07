import { useSyncExternalStore } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export type SocketStatus = "connected" | "connecting" | "disconnected";

let currentStatus: SocketStatus = "connecting";
const statusListeners = new Set<() => void>();

const updateStatus = (next: SocketStatus) => {
  if (currentStatus !== next) {
    currentStatus = next;
    statusListeners.forEach((fn) => fn());
  }
};

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
      updateStatus("connected");
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket.io] Disconnected:", reason);
      updateStatus("disconnected");
    });

    socket.on("connect_error", (error) => {
      console.log("[Socket.io] Connect error:", error);
      updateStatus("disconnected");
    });

    socket.io.on("reconnect_attempt", () => {
      updateStatus("connecting");
    });
  }

  if (socket && !socket.connected && typeof window !== "undefined") {
    socket.connect();
  }

  return socket as Socket;
};

export const reconnectSocket = () => {
  if (typeof window !== "undefined") {
    updateStatus("connecting");
    const s = getSocket();
    if (!s.connected) {
      s.connect();
    }
  }
};

const subscribe = (callback: () => void) => {
  if (typeof window !== "undefined") {
    getSocket();
  }
  statusListeners.add(callback);
  return () => {
    statusListeners.delete(callback);
  };
};

const getSnapshot = (): SocketStatus => {
  if (typeof window === "undefined") return "connecting";
  if (socket?.connected) return "connected";
  return currentStatus;
};

const getServerSnapshot = (): SocketStatus => "connecting";

export const useSocketStatus = (): {
  status: SocketStatus;
  reconnect: () => void;
} => {
  const status = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return { status, reconnect: reconnectSocket };
};


