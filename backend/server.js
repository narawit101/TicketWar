const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const { PrismaClient } = require("@prisma/client");

const PORT = process.env.PORT || 4000;
const prisma = new PrismaClient();

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "ok", service: "TicketWar WebSocket Server" }));
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // Join global Lobby channel (for Home page real-time updates)
  socket.on("join_lobby", () => {
    socket.join("lobby");
    console.log(`[Lobby] Socket ${socket.id} joined lobby`);
  });

  // Join a specific Concert War Room channel
  socket.on("join_room", ({ roomId, user }) => {
    socket.join(roomId);
    console.log(`[Room] ${user?.name || socket.id} joined room: ${roomId}`);
    socket.to(roomId).emit("user_joined", { user, at: new Date().toISOString() });
  });

  // Leave room channel
  socket.on("leave_room", ({ roomId }) => {
    socket.leave(roomId);
    console.log(`[Room] Socket ${socket.id} left room: ${roomId}`);
  });

  // Seat Task status updated (LOOKING / RESERVED / SECURED / FAILED)
  socket.on("update_seat_status", (data) => {
    const { roomId, taskId, status, quantitySecured, updatedBy, securedBy } = data;
    console.log(`[SeatTask] Room ${roomId} - Task ${taskId} updated to ${status} by ${updatedBy}`);

    // Broadcast update to all other members in the room immediately
    socket.to(roomId).emit("seat_status_updated", {
      taskId,
      status,
      quantitySecured,
      updatedBy,
      securedBy,
      updatedAt: "เมื่อสักครู่",
    });
  });

  // New Seat Task created
  socket.on("task_created", ({ roomId, task }) => {
    console.log(`[SeatTask] New task created in ${roomId}: ${task.targetLocation}`);
    socket.to(roomId).emit("task_created", task);
  });

  // Seat Task deleted
  socket.on("task_deleted", ({ roomId, taskId }) => {
    console.log(`[SeatTask] Task ${taskId} deleted in ${roomId}`);
    socket.to(roomId).emit("task_deleted", taskId);
  });

  // Live Chat message sent
  socket.on("send_message", (data) => {
    const { roomId, message } = data;
    console.log(`[Chat] Message in ${roomId} from ${message.userName}`);
    // Broadcast to everyone in the room except the sender
    socket.to(roomId).emit("new_message", message);
  });

  // Live Chat message deleted
  socket.on("delete_message", ({ roomId, messageId }) => {
    console.log(`[Chat] Message ${messageId} deleted in ${roomId}`);
    socket.to(roomId).emit("message_deleted", { messageId });
  });

  // Live Chat message edited
  socket.on("edit_message", ({ roomId, message }) => {
    console.log(`[Chat] Message ${message?.id} edited in ${roomId}`);
    socket.to(roomId).emit("message_updated", message);
  });

  // Quick Shoutout Alert with high priority
  socket.on("send_shoutout", (data) => {
    const { roomId, shoutout } = data;
    console.log(`[Shoutout] High alert in ${roomId}: ${shoutout.tag}`);
    socket.to(roomId).emit("shoutout_alert", shoutout);
  });

  // Room Status Changed (ACTIVE / ARCHIVED / DELETED)
  socket.on("room_status_changed", ({ roomId, status }) => {
    console.log(`[RoomStatus] Room ${roomId} status changed to ${status}`);
    // Broadcast to room members
    io.to(roomId).emit("room_status_changed", { roomId, status });
    // Broadcast to global lobby for home page cards
    io.to("lobby").emit("lobby_room_updated", { roomId, status });
  });

  // Room Details Updated (Title, Banner, Seating Plan, Event Date)
  socket.on("room_updated", ({ roomId, room }) => {
    console.log(`[Room] Room ${roomId} updated: ${room?.title}`);
    io.to(roomId).emit("room_updated", { room });
    io.to("lobby").emit("lobby_room_updated", room);
  });

  // New Room Created (broadcast to Lobby)
  socket.on("room_created", ({ room }) => {
    console.log(`[Lobby] New room created: ${room?.title}`);
    io.to("lobby").emit("lobby_room_created", room);
  });

  // Member Joined Room
  socket.on("member_joined", ({ roomId, user, memberCount }) => {
    console.log(`[Member] New member in ${roomId}: ${user?.name} (total ${memberCount})`);
    io.to(roomId).emit("member_joined", { user, memberCount });
    io.to("lobby").emit("lobby_room_updated", { roomId, memberCount });
  });

  socket.on("disconnect", () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, async () => {
  console.log(`🚀 TicketWar WebSocket server running on port ${PORT}`);

  try {
    await prisma.$connect();
    let dbName = "PostgreSQL";
    if (process.env.DATABASE_URL) {
      const match = process.env.DATABASE_URL.match(/\/([^/?]+)(?:\?|$)/);
      if (match && match[1]) dbName = match[1];
    }
    console.log(`📦 Connected to database (${dbName}) successfully!`);
  } catch (err) {
    console.error(`❌ Database connection error:`, err.message);
  }
});
