import { Server as SocketServer, Socket } from "socket.io";

export function registerSocketHandlers(io: SocketServer) {
  io.on("connection", (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("join:run", (runId: string) => {
      if (runId) {
        socket.join(`run:${runId}`);
        console.log(`Socket ${socket.id} joined room run:${runId}`);
        socket.emit("joined:run", { runId });
      }
    });

    socket.on("leave:run", (runId: string) => {
      if (runId) {
        socket.leave(`run:${runId}`);
        console.log(`Socket ${socket.id} left room run:${runId}`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}
