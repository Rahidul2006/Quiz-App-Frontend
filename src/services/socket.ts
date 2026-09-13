import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socketInstance: Socket | null = null;
let isJudgingRoomActive = false;

export const getSocket = (): Socket => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    socketInstance.on("connect", () => {
      console.log("[Socket.IO] Connected to server:", socketInstance?.id);
      // Automatically re-join global judging room if currently active (handles reconnects)
      if (isJudgingRoomActive) {
        socketInstance?.emit("join:judging");
      }
    });

    socketInstance.on("connect_error", (err) => {
      console.warn("[Socket.IO] Connection notice:", err.message);
    });
  }

  return socketInstance;
};

export const joinEventRoom = (eventId: string): void => {
  const socket = getSocket();
  if (socket.connected) {
    socket.emit("join:event", eventId);
  } else {
    socket.once("connect", () => {
      socket.emit("join:event", eventId);
    });
  }
};

export const leaveEventRoom = (eventId: string): void => {
  const socket = getSocket();
  if (socket.connected) {
    socket.emit("leave:event", eventId);
  }
};

// ======================================
// Global Judging Room (for judges & admin)
// ======================================

export const joinJudgingRoom = (): void => {
  isJudgingRoomActive = true;
  const socket = getSocket();
  if (socket.connected) {
    socket.emit("join:judging");
  }
};

export const leaveJudgingRoom = (): void => {
  isJudgingRoomActive = false;
  const socket = getSocket();
  if (socket.connected) {
    socket.emit("leave:judging");
  }
};
