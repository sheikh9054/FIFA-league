import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import type { AuthPayload } from '../middleware/auth';
import { getAllowedOrigins, getJwtSecret, isOriginAllowed } from '../config/env';

export function initSocket(httpServer: HttpServer): Server {
  const allowedOrigins = getAllowedOrigins();

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        callback(null, isOriginAllowed(origin, allowedOrigins));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (token) {
      try {
        socket.data.user = jwt.verify(token, getJwtSecret()) as AuthPayload;
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
