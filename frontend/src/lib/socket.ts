import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(token?: string | null): Socket {
  const url =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.REACT_APP_API_URL ||
    "https://fifa-league-1.onrender.com";

  if (!socket) {
    socket = io(url, {
      autoConnect: false,
      auth: { token },
    });
  }

  if (token) socket.auth = { token };

  if (!socket.connected) socket.connect();
  return socket;
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
    socket = null;
  }
}
