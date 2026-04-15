const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();

// ============================================
// STEP 1: CREATE HTTP SERVER
// ============================================

const server = http.createServer(app);

// ============================================
// STEP 2: CREATE SOCKET.IO SERVER
// ============================================

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// ============================================
// STEP 3: MIDDLEWARE
// ============================================

app.use(express.json());
app.use(express.static("public"));

// ============================================
// STEP 4: SOCKET.IO EVENTS
// ============================================

io.on("connection", (socket) => {
  socket.username = socket.handshake.auth.username || "Anonymous";

  console.log(`✅ User connected: ${socket.id} (${socket.username})`);

  // ===========================================
  // EVENT 1: DISCONNECT
  // ===========================================

  socket.on("disconnect", (reason) => {
    console.log(`❌ User disconnected: ${socket.id} (${socket.username})`);
    console.log(`Reason: ${reason}`);
  });

  // ===========================================
  // EVENT 2: SEND MESSAGE (Chat)
  // ===========================================

  socket.on("sendMessage", (data) => {
    console.log("Message received:", data);

    if (!data.message || !data.username) {
      socket.emit("error", { message: "Invalid data!" });
      return;
    }

    io.emit("receiveMessage", {
      message: data.message,
      username: data.username,
      time: new Date().toLocaleTimeString(),
      socketId: socket.id,
    });
  });

  // ===========================================
  // EVENT 3: TYPING INDICATOR (Room)
  // ===========================================

  socket.on("typing", (data) => {
    const room = data.room;
    if (!room) return;

    socket.to(room).emit("userTyping", {
      username: data.username,
      isTyping: true,
    });
  });

  socket.on("stopTyping", (data) => {
    const room = data.room;
    if (!room) return;

    socket.to(room).emit("userTyping", {
      username: data.username,
      isTyping: false,
    });
  });

  // ===========================================
  // EVENT 3B: TYPING INDICATOR (DM) ✅ NEW
  // ===========================================

  socket.on("dmTyping", (data) => {
    const { toSocketId, username, isTyping } = data;
    if (!toSocketId) return;

    // Send typing event only to the target user
    socket.to(toSocketId).emit("dmTyping", {
      username: username,
      isTyping: isTyping,
    });
  });

  // ===========================================
  // EVENT 4: JOIN ROOM
  // ===========================================

  socket.on("joinRoom", (data) => {
    const { room, username } = data;

    socket.join(room);

    console.log(`${username} joined room: ${room}`);

    io.to(room).emit("roomNotification", {
      message: `${username} joined the room! 👋`,
      type: "join",
    });

    broadcastOnlineUsers();
  });

  // ===========================================
  // EVENT 5: ROOM MESSAGE
  // ===========================================

  socket.on("roomMessage", (data) => {
    const { room, message, username } = data;

    if (!room || !message || !username) {
      socket.emit("error", { message: "Invalid data!" });
      return;
    }

    socket.to(room).emit("userTyping", {
      username,
      isTyping: false,
    });

    io.to(room).emit("receiveRoomMessage", {
      message,
      username,
      room,
      time: new Date().toLocaleTimeString(),
      socketId: socket.id,
    });
  });

  // ===========================================
  // EVENT 6: LEAVE ROOM
  // ===========================================

  socket.on("leaveRoom", (data) => {
    const { room, username } = data;

    socket.leave(room);

    io.to(room).emit("roomNotification", {
      message: `${username} left the room! 👋`,
      type: "leave",
    });
  });

  // ===========================================
  // EVENT 7: PRIVATE MESSAGE
  // ===========================================

  socket.on("privateMessage", (data) => {
    const { toSocketId, message, username } = data;

    io.to(toSocketId).emit("receivePrivateMessage", {
      message,
      from: username,
      fromSocketId: socket.id,
      time: new Date().toLocaleTimeString(),
    });

    socket.emit("receivePrivateMessage", {
      message,
      from: "You",
      fromSocketId: socket.id,
      to: toSocketId,
      time: new Date().toLocaleTimeString(),
    });
  });

  // ===========================================
  // EVENT 8: GET ONLINE USERS
  // ===========================================

  socket.on("getOnlineUsers", () => {
    socket.emit("onlineUsers", getOnlineUsersList());
  });
});

// ============================================
// HELPER: Build online users list
// ============================================

const getOnlineUsersList = () => {
  const onlineUsers = [];
  io.sockets.sockets.forEach((s) => {
    onlineUsers.push({
      socketId: s.id,
      username: s.username,
    });
  });
  return {
    users: onlineUsers,
    count: onlineUsers.length,
  };
};

// ============================================
// HELPER: Broadcast online users to everyone
// ============================================

const broadcastOnlineUsers = () => {
  io.emit("onlineUsers", getOnlineUsersList());
};

// ============================================
// STEP 5: EXPRESS ROUTES
// ============================================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ============================================
// STEP 6: START SERVER
// ============================================

server.listen(3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000} 🚀`);
});
