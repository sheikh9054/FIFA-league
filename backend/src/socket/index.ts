import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import type { AuthPayload } from '../middleware/auth';

export function initSocket(httpServer: HttpServer): Server {
  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (origin.endsWith('.vercel.app')) return callback(null, true);
        if (origin.includes('localhost')) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (token) {
      try {
        const secret = process.env.JWT_SECRET || 'dev-secret';
        socket.data.user = jwt.verify(token, secret) as AuthPayload;
      } catch {
        /* guest / public */
      }
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    socket.on('join:league', (leagueId: string) => {
      socket.join(`league:${leagueId}`);
    });

    socket.on('leave:league', (leagueId: string) => {
      socket.leave(`league:${leagueId}`);
    });

    socket.on('join:match', (matchId: string) => {
      socket.join(`match:${matchId}`);
    });

    socket.on('disconnect', () => {
      /* cleanup */
    });
  });

  return io;
}
