import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { prisma } from './db';
import { verifyToken } from './auth';

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

  const connectedUsers = new Map<string, { userId: string; email: string; socketId: string }>();

  io.on('connection', (socket: Socket) => {
    console.log('User connected:', socket.id);

    socket.on('user:join', async (token: string) => {
      try {
        const payload = verifyToken(token);
        if (!payload) {
          socket.emit('error', 'Invalid token');
          socket.disconnect();
          return;
        }

        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: { id: true, email: true, name: true },
        });

        if (!user) {
          socket.emit('error', 'User not found');
          socket.disconnect();
          return;
        }

        // ذخیره اطلاعات کاربر
        connectedUsers.set(socket.id, {
          userId: user.id,
          email: user.email || '',
          socketId: socket.id,
        });

        // اطلاع دهی به همه کاربران
        io?.emit('user:online', {
          userId: user.id,
          email: user.email,
          name: user.name,
          onlineUsers: Array.from(connectedUsers.values()).map((u) => ({
            userId: u.userId,
            email: u.email,
          })),
        });

        console.log(`User ${user.email} joined (${socket.id})`);
      } catch (error) {
        console.error('Join error:', error);
        socket.emit('error', 'Join failed');
      }
    });

    socket.on('message:send', async (data: { content?: string; imageUrl?: string }) => {
      try {
        const user = connectedUsers.get(socket.id);
        if (!user) {
          socket.emit('error', 'User not authenticated');
          return;
        }

        const message = await prisma.message.create({
          data: {
            content: data.content || null,
            imageUrl: data.imageUrl || null,
            userId: user.userId,
          },
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
          },
        });

        // پخش پیام به تمام کاربران
        io?.emit('message:new', message);
        console.log(`Message from ${user.email}: ${data.content}`);
      } catch (error) {
        console.error('Message error:', error);
        socket.emit('error', 'Message send failed');
      }
    });

    socket.on('disconnect', () => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        connectedUsers.delete(socket.id);
        io?.emit('user:offline', {
          userId: user.userId,
          email: user.email,
          onlineUsers: Array.from(connectedUsers.values()).map((u) => ({
            userId: u.userId,
            email: u.email,
          })),
        });
        console.log(`User ${user.email} disconnected`);
      }
    });
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}
