// ponytail: pure WebSocket relay server without DB dependencies or sync blocking logs
const http = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "*";

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "ok", service: "TicketWar WebSocket Server" }));
});

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
  },
});

const isDev = process.env.NODE_ENV !== "production";
const log = isDev ? (...args) => console.log(...args) : () => {};

io.on("connection", (socket) => {
  log(`[Socket.io] Client connected: ${socket.id}`);

  // Lobby
  socket.on("join_lobby", () => socket.join("lobby"));

  // Room lifecycle
  socket.on("join_room", ({ roomId, user }) => {
    socket.join(roomId);
    socket.to(roomId).emit("user_joined", { user, at: new Date().toISOString() });
  });

  socket.on("leave_room", ({ roomId }) => socket.leave(roomId));

  // Seat tasks
  socket.on("update_seat_status", (data) => {
    const { roomId, taskId, status, quantitySecured, updatedBy, securedBy } = data;
    socket.to(roomId).emit("seat_status_updated", {
      taskId,
      status,
      quantitySecured,
      updatedBy,
      securedBy,
      updatedAt: "เมื่อสักครู่",
    });
  });

  socket.on("task_created", ({ roomId, task }) => socket.to(roomId).emit("task_created", task));
  socket.on("task_deleted", ({ roomId, taskId }) => socket.to(roomId).emit("task_deleted", taskId));

  // Chat & shoutouts
  socket.on("send_message", ({ roomId, message }) => socket.to(roomId).emit("new_message", message));
  socket.on("delete_message", ({ roomId, messageId }) => socket.to(roomId).emit("message_deleted", { messageId }));
  socket.on("edit_message", ({ roomId, message }) => socket.to(roomId).emit("message_updated", message));
  socket.on("send_shoutout", ({ roomId, shoutout }) => socket.to(roomId).emit("shoutout_alert", shoutout));

  // Room status & updates
  socket.on("room_status_changed", ({ roomId, status }) => {
    io.to(roomId).emit("room_status_changed", { roomId, status });
    io.to("lobby").emit("lobby_room_updated", { roomId, status });
  });

  socket.on("room_updated", ({ roomId, room }) => {
    io.to(roomId).emit("room_updated", { room });
    io.to("lobby").emit("lobby_room_updated", room);
  });

  socket.on("room_created", ({ room }) => io.to("lobby").emit("lobby_room_created", room));

  socket.on("member_joined", ({ roomId, user, memberCount }) => {
    io.to(roomId).emit("member_joined", { user, memberCount });
    io.to("lobby").emit("lobby_room_updated", { roomId, memberCount });
  });

  socket.on("member_kicked", ({ roomId, targetUserId, memberName, kickedBy }) => {
    io.to(roomId).emit("member_kicked", { targetUserId, memberName, kickedBy });
    io.to("lobby").emit("lobby_room_updated", { roomId });
  });

  socket.on("disconnect", () => {
    log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 TicketWar WebSocket server running on port ${PORT}`);
});
