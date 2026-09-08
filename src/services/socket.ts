import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socketInstance: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    socketInstance.on("connect", () => {
      console.log("[Socket.IO] Connected to server:", socketInstance?.id);
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
