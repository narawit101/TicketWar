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

  // Personal user channel for real-time notifications
  socket.on("join_user", ({ userId }) => {
    if (userId) {
      socket.join(`user:${userId}`);
    }
  });

  // Invitation events
  socket.on("send_room_invitation", ({ inviteeId, invitation }) => {
    if (inviteeId) {
      io.to(`user:${inviteeId}`).emit("room_invitation_received", invitation);
    }
  });

  socket.on("cancel_room_invitation", ({ inviteeId, roomId, invitationId }) => {
    if (inviteeId) {
      io.to(`user:${inviteeId}`).emit("room_invitation_canceled", { roomId, invitationId });
    }
  });

  socket.on("room_invitation_responded", ({ inviterId, roomId, member, status }) => {
    if (inviterId) {
      io.to(`user:${inviterId}`).emit("room_invitation_update", { roomId, member, status });
    }
  });

  // Room lifecycle
  socket.on("join_room", ({ roomId, user }) => {
    socket.join(roomId);
    socket.to(roomId).emit("user_joined", { user, at: new Date().toISOString() });
  });

  socket.on("leave_room", ({ roomId }) => socket.leave(roomId));

  // Seat tasks
  socket.on("update_seat_status", (data) => {
    const { roomId, ...rest } = data;
    socket.to(roomId).emit("seat_status_updated", {
      ...rest,
      updatedAt: "เมื่อสักครู่",
    });
  });

  socket.on("task_created", ({ roomId, task }) => socket.to(roomId).emit("task_created", task));
  socket.on("task_deleted", ({ roomId, taskId }) => socket.to(roomId).emit("task_deleted", taskId));

  // Chat & shoutouts
  socket.on("send_message", ({ roomId, message }) => {
    socket.to(roomId).emit("new_message", message);
    io.to("lobby").emit("lobby_room_message", { roomId, senderId: message?.userId });
  });
  socket.on("delete_message", ({ roomId, messageId }) => socket.to(roomId).emit("message_deleted", { messageId }));
  socket.on("edit_message", ({ roomId, message }) => socket.to(roomId).emit("message_updated", message));
  socket.on("send_shoutout", ({ roomId, shoutout }) => {
    socket.to(roomId).emit("shoutout_alert", shoutout);
    io.to("lobby").emit("lobby_room_message", { roomId, senderId: shoutout?.userId });
  });
  socket.on("update_reaction", ({ roomId, messageId, reactions }) => socket.to(roomId).emit("message_reaction_updated", { messageId, reactions }));
  socket.on("update_pin_message", ({ roomId, pinnedMessage }) => io.to(roomId).emit("room_pinned_message_updated", { pinnedMessage }));
  socket.on("typing_start", ({ roomId, user }) => socket.to(roomId).emit("user_typing", { user, isTyping: true }));
  socket.on("typing_stop", ({ roomId, userId }) => socket.to(roomId).emit("user_typing", { userId, isTyping: false }));
  socket.on("mark_read", ({ roomId, userId, messageId, user }) => {
    socket.to(roomId).emit("user_read", { userId, messageId, user });
    if (userId) {
      io.to(`user:${userId}`).emit("lobby_room_read", { roomId });
    }
  });

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

  socket.on("member_joined", ({ roomId, user, memberCount, message }) => {
    io.to(roomId).emit("member_joined", { user, memberCount, message });
    if (message) {
      io.to(roomId).emit("new_message", message);
      io.to("lobby").emit("lobby_room_message", { roomId, senderId: message?.userId });
    }
    io.to("lobby").emit("lobby_room_updated", { roomId, memberCount });
  });

  socket.on("send_room_invitation_chat", ({ roomId, message }) => {
    if (roomId && message) {
      io.to(roomId).emit("new_message", message);
      io.to("lobby").emit("lobby_room_message", { roomId, senderId: message?.userId });
    }
  });

  socket.on("member_kicked", (data) => {
    const { roomId, message } = data;
    io.to(roomId).emit("member_kicked", data);
    if (message) {
      io.to(roomId).emit("new_message", message);
    }
    io.to("lobby").emit("lobby_room_updated", { roomId });
  });

  socket.on("disconnect", () => {
    log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 TicketWar WebSocket server running on port ${PORT}`);
});
