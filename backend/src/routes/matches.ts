import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { optionalAuth, authenticate, requireAdmin } from '../middleware/auth';
import { recordLeagueMatch } from '../services/matchService';
import type { Server as SocketServer } from 'socket.io';

const router = Router();

const recordSchema = z.object({
  leagueId: z.string(),
  homePlayerId: z.string(),
  awayPlayerId: z.string(),
  homeScore: z.number().min(0),
  awayScore: z.number().min(0),
  matchType: z.enum(['LEAGUE', 'FRIENDLY', 'TOURNAMENT', 'KNOCKOUT']).optional(),
  notes: z.string().optional(),
  screenshots: z.array(z.string()).optional(),
  matchday: z.number().optional(),
  status: z.enum(['COMPLETED', 'PENDING_APPROVAL']).optional(),
  tournamentId: z.string().optional(),
});

export function createMatchRoutes(io: SocketServer) {
  router.get('/league/:leagueId', optionalAuth, async (req, res, next) => {
    try {
      const { type, limit = '50' } = req.query;
      const matches = await prisma.match.findMany({
        where: {
          leagueId: req.params.leagueId,
          ...(type ? { matchType: type as 'LEAGUE' | 'FRIENDLY' | 'TOURNAMENT' | 'KNOCKOUT' } : {}),
        },
        orderBy: { playedAt: 'desc' },
        take: parseInt(limit as string, 10),
        include: {
          homePlayer: true,
          awayPlayer: true,
          comments: { include: { user: { select: { name: true, avatar: true } } } },
          reactions: true,
        },
      });
      res.json(matches);
    } catch (e) {
      next(e);
    }
  });

  router.get('/:id', optionalAuth, async (req, res, next) => {
    try {
      const match = await prisma.match.findUnique({
        where: { id: req.params.id },
        include: {
          homePlayer: true,
          awayPlayer: true,
          winner: true,
          comments: { include: { user: true }, orderBy: { createdAt: 'asc' } },
          reactions: { include: { user: true } },
        },
      });
      if (!match) return res.status(404).json({ error: 'Match not found' });
      res.json(match);
    } catch (e) {
      next(e);
    }
  });

  router.post('/', authenticate, async (req, res, next) => {
    try {
      const data = recordSchema.parse(req.body);
      const match = await recordLeagueMatch(data, io);
      res.status(201).json(match);
    } catch (e) {
      next(e);
    }
  });

  router.patch('/:id/approve', authenticate, requireAdmin, async (req, res, next) => {
    try {
      const existing = await prisma.match.findUnique({ where: { id: req.params.id } });
      if (!existing || existing.status !== 'PENDING_APPROVAL') {
        return res.status(400).json({ error: 'Match not pending approval' });
      }

      const match = await recordLeagueMatch(
        {
          leagueId: existing.leagueId,
          homePlayerId: existing.homePlayerId,
          awayPlayerId: existing.awayPlayerId,
          homeScore: existing.homeScore,
          awayScore: existing.awayScore,
          matchType: existing.matchType,
          notes: existing.notes ?? undefined,
          matchday: existing.matchday ?? undefined,
          status: 'COMPLETED',
        },
        io
      );

      await prisma.match.delete({ where: { id: req.params.id } });
      res.json(match);
    } catch (e) {
      next(e);
    }
  });

  router.post('/:id/comments', authenticate, async (req, res, next) => {
    try {
      const content = z.string().min(1).parse(req.body.content);
      const comment = await prisma.comment.create({
        data: {
          matchId: req.params.id,
          userId: req.user!.userId,
          content,
        },
        include: { user: { select: { name: true, avatar: true } } },
      });
      io.to(`match:${req.params.id}`).emit('comment:new', comment);
      res.status(201).json(comment);
    } catch (e) {
      next(e);
    }
  });

  router.post('/:id/reactions', authenticate, async (req, res, next) => {
    try {
      const emoji = z.string().parse(req.body.emoji);
      const reaction = await prisma.reaction.upsert({
        where: {
          matchId_userId_emoji: {
            matchId: req.params.id,
            userId: req.user!.userId,
            emoji,
          },
        },
        create: {
          matchId: req.params.id,
          userId: req.user!.userId,
          emoji,
        },
        update: {},
        include: { user: { select: { name: true } } },
      });
      io.to(`match:${req.params.id}`).emit('reaction:new', reaction);
      res.status(201).json(reaction);
    } catch (e) {
      next(e);
    }
  });

  return router;
}

export default router;
