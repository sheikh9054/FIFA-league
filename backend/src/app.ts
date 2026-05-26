import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import { optionalAuth } from './middleware/auth';
import authRoutes from './routes/auth';
import leagueRoutes from './routes/leagues';
import playerRoutes from './routes/players';
import standingsRoutes from './routes/standings';
import statsRoutes from './routes/stats';
import fixtureRoutes from './routes/fixtures';
import tournamentRoutes from './routes/tournaments';
import adminRoutes from './routes/admin';
import { createMatchRoutes } from './routes/matches';
import { createFriendlyRoutes } from './routes/friendlies';
import { createAnnouncementRoutes } from './routes/announcements';
import { initSocket } from './socket';
import { getAllowedOrigins, isOriginAllowed } from './config/env';

export function createAppAndServer() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  const allowedOrigins = getAllowedOrigins();

  app.use(
    cors({
      origin: (origin, callback) => {
        callback(null, isOriginAllowed(origin, allowedOrigins));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
  });
  app.use('/api', limiter);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use(optionalAuth);

  const httpServer = http.createServer(app);
  const io = initSocket(httpServer);

  app.use('/api/auth', authRoutes);
  app.use('/api/leagues', leagueRoutes);
  app.use('/api/players', playerRoutes);
  app.use('/api/matches', createMatchRoutes(io));
  app.use('/api/friendlies', createFriendlyRoutes(io));
  app.use('/api/standings', standingsRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/fixtures', fixtureRoutes);
  app.use('/api/tournaments', tournamentRoutes);
  app.use('/api/announcements', createAnnouncementRoutes(io));
  app.use('/api/admin', adminRoutes);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use(errorHandler);

  return httpServer;
}
