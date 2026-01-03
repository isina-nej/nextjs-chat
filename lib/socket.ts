import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server | null = null;

export function initializeSocket(httpServer: HTTPServer): Server {
  if (io) return io;

  io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log('User connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}

