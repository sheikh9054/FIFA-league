import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireAdmin);

router.patch('/players/:id/standings', async (req, res, next) => {
  try {
    const schema = z.object({
      played: z.number().optional(),
      wins: z.number().optional(),
      draws: z.number().optional(),
      losses: z.number().optional(),
      goalsFor: z.number().optional(),
      goalsAgainst: z.number().optional(),
      goalDifference: z.number().optional(),
      points: z.number().optional(),
      elo: z.number().optional(),
    });
    const player = await prisma.player.update({
      where: { id: req.params.id },
      data: schema.parse(req.body),
    });
    res.json(player);
  } catch (e) {
    next(e);
  }
});

router.get('/export/:leagueId', async (req, res, next) => {
  try {
    const [league, players, matches, fixtures] = await Promise.all([
      prisma.league.findUnique({ where: { id: req.params.leagueId } }),
      prisma.player.findMany({ where: { leagueId: req.params.leagueId } }),
      prisma.match.findMany({ where: { leagueId: req.params.leagueId } }),
      prisma.fixture.findMany({ where: { leagueId: req.params.leagueId } }),
    ]);

    res.json({
      exportedAt: new Date().toISOString(),
      league,
      players,
      matches,
      fixtures,
    });
  } catch (e) {
    next(e);
  }
});

router.post('/elo-reset/:leagueId', async (req, res, next) => {
  try {
    await prisma.player.updateMany({
      where: { leagueId: req.params.leagueId },
      data: { elo: 1500 },
    });
    await prisma.eloHistory.deleteMany({
      where: { player: { leagueId: req.params.leagueId } },
    });
    res.json({ message: 'ELO ratings reset to 1500' });
  } catch (e) {
    next(e);
  }
});

export default router;
