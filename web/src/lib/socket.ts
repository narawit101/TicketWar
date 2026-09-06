import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

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
