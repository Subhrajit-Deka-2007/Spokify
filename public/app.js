// ============================================
// VARIABLES
// ============================================

let socket = null;
let username = "";
let currentRoom = "general";
let typingTimeout = null;

// DM variables
let dmTargetId = "";
let dmTargetName = "";
let dmTypingTimeout = null; // ✅ NEW: timeout for DM typing

// ============================================
// STEP 1: JOIN CHAT (Login)
// ============================================

const joinChat = () => {
  username = document.getElementById("usernameInput").value.trim();

  if (!username) {
    alert("Please enter your name!");
    return;
  }

  document.getElementById("loginArea").style.display = "none";

  socket = io("http://localhost:3000", {
    auth: {
      username: username,
    },
  });

  setupSocketEvents();
};

// ============================================
// STEP 2: SETUP SOCKET EVENTS
// ============================================

const setupSocketEvents = () => {
  // ===== CONNECTION EVENTS =====

  socket.on("connect", () => {
    console.log("Connected! Socket ID:", socket.id);

    const status = document.getElementById("status");
    status.textContent = "● Connected";
    status.className = "connected";

    joinRoom("general");
    socket.emit("getOnlineUsers");
  });

  socket.on("disconnect", (reason) => {
    console.log("Disconnected:", reason);

    const status = document.getElementById("status");
    status.textContent = "● Disconnected";
    status.className = "disconnected";
  });

  socket.on("connect_error", (error) => {
    console.error("Connection error:", error);
    alert("Cannot connect to server! Is it running?");
  });

  // ===== MESSAGE EVENTS =====

  socket.on("receiveMessage", (data) => {
    displayMessage(data, data.socketId === socket.id);
  });

  socket.on("receiveRoomMessage", (data) => {
    displayMessage(data, data.socketId === socket.id);
  });

  // Show incoming DM in the DM panel
  socket.on("receivePrivateMessage", (data) => {
    if (data.from === "You") return;

    if (dmTargetId !== data.fromSocketId) {
      openDM(data.fromSocketId, data.from);
    }

    const div = document.createElement("div");
    div.className = "dm-msg-other";
    div.innerHTML = `
            <div class="dm-bubble-other">
                <span class="dm-sender">${data.from}</span>
                ${data.message}
            </div>
        `;
    document.getElementById("dmMessages").appendChild(div);
    document.getElementById("dmMessages").scrollTop = 99999;
    document.getElementById("dmPanel").style.display = "flex";
  });

  // ===== TYPING EVENTS (Room) =====

  socket.on("userTyping", (data) => {
    const typingDiv = document.getElementById("typing");
    typingDiv.textContent = data.isTyping
      ? `${data.username} is typing...`
      : "";
  });

  // ===== TYPING EVENTS (DM) ✅ NEW =====

  socket.on("dmTyping", (data) => {
    const dmTypingDiv = document.getElementById("dmTyping");
    if (dmTypingDiv) {
      dmTypingDiv.textContent = data.isTyping
        ? `${data.username} is typing...`
        : "";
    }
  });

  // ===== ROOM EVENTS =====

  socket.on("roomNotification", (data) => {
    displayNotification(data.message);
  });

  // Online users list with DM buttons
  socket.on("onlineUsers", (data) => {
    document.getElementById("onlineUsers").textContent = `${data.count} online`;

    const list = document.getElementById("onlineList");
    list.innerHTML = "";

    data.users.forEach((u) => {
      if (u.socketId === socket.id) return;

      const btn = document.createElement("button");
      btn.className = "online-user-btn";
      btn.innerHTML = `
                <span class="online-dot"></span>
                <span>${u.username}</span>
                <span class="dm-badge">DM</span>
            `;
      btn.onclick = () => openDM(u.socketId, u.username);
      list.appendChild(btn);
    });
  });

  // ===== ERROR =====

  socket.on("error", (data) => {
    console.error("Socket error:", data.message);
    alert(data.message);
  });
};

// ============================================
// STEP 3: SEND MESSAGE
// ============================================

const sendMessage = () => {
  const messageInput = document.getElementById("messageInput");
  const message = messageInput.value.trim();

  if (!message) return;

  if (!socket || !socket.connected) {
    alert("Not connected to server!");
    return;
  }

  socket.emit("roomMessage", {
    room: currentRoom,
    message: message,
    username: username,
  });

  messageInput.value = "";

  socket.emit("stopTyping", { username, room: currentRoom });
  clearTimeout(typingTimeout);
};

// ============================================
// STEP 4: JOIN ROOM
// ============================================

const joinRoom = (roomName) => {
  if (!socket || !socket.connected) return;

  if (currentRoom) {
    socket.emit("leaveRoom", {
      room: currentRoom,
      username: username,
    });
  }

  currentRoom = roomName;

  document.getElementById("currentRoom").textContent = `# ${roomName}`;

  document.querySelectorAll(".room-btn").forEach((btn) => {
    btn.classList.remove("active");
    if (btn.textContent.trim() === `# ${roomName}`) {
      btn.classList.add("active");
    }
  });

  document.getElementById("messages").innerHTML = "";

  socket.emit("joinRoom", {
    room: roomName,
    username: username,
  });

  socket.emit("getOnlineUsers");
};

// ============================================
// STEP 5: TYPING INDICATOR (Room)
// ============================================

const handleTyping = () => {
  if (!socket) return;

  socket.emit("typing", { username, room: currentRoom });

  clearTimeout(typingTimeout);

  typingTimeout = setTimeout(() => {
    socket.emit("stopTyping", { username, room: currentRoom });
  }, 1500);
};

// ============================================
// STEP 5B: TYPING INDICATOR (DM) ✅ NEW
// ============================================

const handleDMTyping = () => {
  if (!socket || !dmTargetId) return;

  socket.emit("dmTyping", {
    toSocketId: dmTargetId,
    username: username,
    isTyping: true,
  });

  clearTimeout(dmTypingTimeout);

  dmTypingTimeout = setTimeout(() => {
    socket.emit("dmTyping", {
      toSocketId: dmTargetId,
      username: username,
      isTyping: false,
    });
  }, 1500);
};

// ============================================
// STEP 6: HANDLE ENTER KEY
// ============================================

const handleKeyPress = (event) => {
  if (event.key === "Enter") {
    sendMessage();
  }
};

// ============================================
// STEP 7: DISPLAY MESSAGES
// ============================================

const displayMessage = (data, isOwnMessage) => {
  const messagesDiv = document.getElementById("messages");

  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isOwnMessage ? "own" : ""}`;

  messageDiv.innerHTML = `
        ${!isOwnMessage ? `<div class="message-username">${data.username}</div>` : ""}
        <div class="message-bubble">
            ${data.message}
        </div>
        <div class="message-time">${data.time}</div>
    `;

  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
};

const displayNotification = (message) => {
  const messagesDiv = document.getElementById("messages");

  const notifDiv = document.createElement("div");
  notifDiv.className = "notification";
  notifDiv.textContent = message;

  messagesDiv.appendChild(notifDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
};

// ============================================
// PRIVATE CHAT (DM) FUNCTIONS
// ============================================

const openDM = (socketId, name) => {
  dmTargetId = socketId;
  dmTargetName = name;

  document.getElementById("dmTitle").textContent = `🔒 ${name}`;
  document.getElementById("dmMessages").innerHTML = "";
  document.getElementById("dmPanel").style.display = "flex";
  document.getElementById("dmInput").focus();
};

const closeDM = () => {
  // ✅ Stop typing when DM is closed
  if (socket && dmTargetId) {
    socket.emit("dmTyping", {
      toSocketId: dmTargetId,
      username: username,
      isTyping: false,
    });
  }
  document.getElementById("dmPanel").style.display = "none";
  dmTargetId = "";
  dmTargetName = "";
};

const sendDM = () => {
  const input = document.getElementById("dmInput");
  const message = input.value.trim();

  if (!message) return;
  if (!dmTargetId) {
    alert("No user selected for DM!");
    return;
  }
  if (!socket || !socket.connected) {
    alert("Not connected to server!");
    return;
  }

  // ✅ Stop typing indicator when message is sent
  clearTimeout(dmTypingTimeout);
  socket.emit("dmTyping", {
    toSocketId: dmTargetId,
    username: username,
    isTyping: false,
  });

  socket.emit("privateMessage", {
    toSocketId: dmTargetId,
    message: message,
    username: username,
  });

  const div = document.createElement("div");
  div.className = "dm-msg-own";
  div.innerHTML = `<div class="dm-bubble-own">${message}</div>`;
  document.getElementById("dmMessages").appendChild(div);
  document.getElementById("dmMessages").scrollTop = 99999;

  input.value = "";
};

const handleDMKey = (event) => {
  if (event.key === "Enter") {
    sendDM();
  }
};
