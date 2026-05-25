import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { optionalAuth, authenticate } from '../middleware/auth';
import { recordFriendlyMatch } from '../services/matchService';
import type { Server as SocketServer } from 'socket.io';

const friendlySchema = z.object({
  homePlayerId: z.string(),
  awayPlayerId: z.string(),
  homeScore: z.number().min(0),
  awayScore: z.number().min(0),
  affectsElo: z.boolean().optional(),
  notes: z.string().optional(),
  screenshots: z.array(z.string()).optional(),
});

export function createFriendlyRoutes(io: SocketServer) {
  const router = Router();

  router.get('/league/:leagueId', optionalAuth, async (req, res, next) => {
    try {
      const playerIds = (
        await prisma.player.findMany({
          where: { leagueId: req.params.leagueId },
          select: { id: true },
        })
      ).map((p) => p.id);

      const matches = await prisma.friendlyMatch.findMany({
        where: {
          OR: [
            { homePlayerId: { in: playerIds } },
            { awayPlayerId: { in: playerIds } },
          ],
        },
        orderBy: { playedAt: 'desc' },
        take: 50,
        include: { homePlayer: true, awayPlayer: true },
      });
      res.json(matches);
    } catch (e) {
      next(e);
    }
  });

  router.get('/leaderboard/:leagueId', optionalAuth, async (req, res, next) => {
    try {
      const playerIds = (
        await prisma.player.findMany({
          where: { leagueId: req.params.leagueId },
          select: { id: true },
        })
      ).map((p) => p.id);

      const matches = await prisma.friendlyMatch.findMany({
        where: {
          OR: [
            { homePlayerId: { in: playerIds } },
            { awayPlayerId: { in: playerIds } },
          ],
        },
        include: { homePlayer: true, awayPlayer: true },
      });

      const stats: Record<string, { wins: number; draws: number; losses: number; gf: number; ga: number; player: unknown }> = {};

      for (const m of matches) {
        for (const pid of [m.homePlayerId, m.awayPlayerId]) {
          if (!stats[pid]) {
            const p = pid === m.homePlayerId ? m.homePlayer : m.awayPlayer;
            stats[pid] = { wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, player: p };
          }
        }
        const home = stats[m.homePlayerId];
        const away = stats[m.awayPlayerId];
        home.gf += m.homeScore;
        home.ga += m.awayScore;
        away.gf += m.awayScore;
        away.ga += m.homeScore;

        if (m.homeScore > m.awayScore) {
          home.wins++;
          away.losses++;
        } else if (m.awayScore > m.homeScore) {
          away.wins++;
          home.losses++;
        } else {
          home.draws++;
          away.draws++;
        }
      }

      const leaderboard = Object.values(stats)
        .map((s) => ({ ...s, played: s.wins + s.draws + s.losses, gd: s.gf - s.ga }))
        .sort((a, b) => b.wins - a.wins || b.gd - a.gd);

      res.json(leaderboard);
    } catch (e) {
      next(e);
    }
  });

  router.get('/h2h/:player1/:player2', optionalAuth, async (req, res, next) => {
    try {
      const matches = await prisma.friendlyMatch.findMany({
        where: {
          OR: [
            { homePlayerId: req.params.player1, awayPlayerId: req.params.player2 },
            { homePlayerId: req.params.player2, awayPlayerId: req.params.player1 },
          ],
        },
        orderBy: { playedAt: 'desc' },
        include: { homePlayer: true, awayPlayer: true },
      });
      res.json(matches);
    } catch (e) {
      next(e);
    }
  });

  router.post('/', authenticate, async (req, res, next) => {
    try {
      const data = friendlySchema.parse(req.body);
      const match = await recordFriendlyMatch(data, io);
      res.status(201).json(match);
    } catch (e) {
      next(e);
    }
  });

  return router;
}
