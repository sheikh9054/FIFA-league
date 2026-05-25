import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { optionalAuth, requireAdmin, authenticate } from '../middleware/auth';
import { getDashboard } from '../services/statsService';

const router = Router();

const createLeagueSchema = z.object({
  name: z.string().min(1),
  logo: z.string().optional(),
  banner: z.string().optional(),
  season: z.string().optional(),
  description: z.string().optional(),
});

router.get('/', optionalAuth, async (_req, res, next) => {
  try {
    const leagues = await prisma.league.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { players: true, matches: true } } },
    });
    res.json(leagues);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const league = await prisma.league.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { players: true, matches: true } } },
    });
    if (!league) return res.status(404).json({ error: 'League not found' });
    res.json(league);
  } catch (e) {
    next(e);
  }
});

router.get('/:id/dashboard', optionalAuth, async (req, res, next) => {
  try {
    const dashboard = await getDashboard(req.params.id);
    res.json(dashboard);
  } catch (e) {
    next(e);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const data = createLeagueSchema.parse(req.body);
    const inviteCode = Math.random().toString(36).slice(2, 10).toUpperCase();
    const league = await prisma.league.create({
      data: { ...data, inviteCode },
    });
    res.status(201).json(league);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const league = await prisma.league.update({
      where: { id: req.params.id },
      data: createLeagueSchema.partial().parse(req.body),
    });
    res.json(league);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/reset-season', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const leagueId = req.params.id;
    await prisma.$transaction([
      prisma.player.updateMany({
        where: { leagueId },
        data: {
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
          cleanSheets: 0,
          currentForm: '',
          elo: 1500,
        },
      }),
      prisma.match.deleteMany({ where: { leagueId, matchType: 'LEAGUE' } }),
      prisma.fixture.deleteMany({ where: { leagueId } }),
    ]);
    res.json({ message: 'Season reset successfully' });
  } catch (e) {
    next(e);
  }
});

router.get('/invite/:code', optionalAuth, async (req, res, next) => {
  try {
    const league = await prisma.league.findUnique({
      where: { inviteCode: req.params.code.toUpperCase() },
    });
    if (!league) return res.status(404).json({ error: 'Invalid invite code' });
    res.json(league);
  } catch (e) {
    next(e);
  }
});

export default router;
