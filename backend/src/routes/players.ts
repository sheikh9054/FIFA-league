import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { optionalAuth, requireAdmin, authenticate } from '../middleware/auth';
import { computeWinPercentage } from '../utils/standings';

const router = Router();

const playerSchema = z.object({
  leagueId: z.string(),
  name: z.string().min(1),
  nickname: z.string().optional(),
  avatar: z.string().optional(),
  country: z.string().optional(),
  favoriteClub: z.string().optional(),
  elo: z.number().optional(),
});

router.get('/league/:leagueId', optionalAuth, async (req, res, next) => {
  try {
    const players = await prisma.player.findMany({
      where: { leagueId: req.params.leagueId },
      orderBy: [{ points: 'desc' }, { goalDifference: 'desc' }],
    });
    res.json(
      players.map((p) => ({
        ...p,
        winPercentage: computeWinPercentage(p.wins, p.played),
      }))
    );
  } catch (e) {
    next(e);
  }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const player = await prisma.player.findUnique({
      where: { id: req.params.id },
      include: {
        homeMatches: {
          take: 10,
          orderBy: { playedAt: 'desc' },
          include: { awayPlayer: true },
        },
        awayMatches: {
          take: 10,
          orderBy: { playedAt: 'desc' },
          include: { homePlayer: true },
        },
        eloHistory: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const matchHistory = [
      ...player.homeMatches.map((m) => ({ ...m, side: 'home' as const })),
      ...player.awayMatches.map((m) => ({ ...m, side: 'away' as const })),
    ]
      .sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime())
      .slice(0, 15);

    res.json({
      ...player,
      winPercentage: computeWinPercentage(player.wins, player.played),
      matchHistory,
    });
  } catch (e) {
    next(e);
  }
});

router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const data = playerSchema.parse(req.body);
    const player = await prisma.player.create({ data });
    res.status(201).json(player);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const player = await prisma.player.update({
      where: { id: req.params.id },
      data: playerSchema.partial().omit({ leagueId: true }).parse(req.body),
    });
    res.json(player);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await prisma.player.delete({ where: { id: req.params.id } });
    res.json({ message: 'Player deleted' });
  } catch (e) {
    next(e);
  }
});

export default router;
