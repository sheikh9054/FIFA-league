import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/league/:leagueId', optionalAuth, async (req, res, next) => {
  try {
    const tournaments = await prisma.tournament.findMany({
      where: { leagueId: req.params.leagueId },
      include: { players: { include: { player: true } }, _count: { select: { matches: true } } },
    });
    res.json(tournaments);
  } catch (e) {
    next(e);
  }
});

router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const schema = z.object({
      leagueId: z.string(),
      name: z.string(),
      format: z.enum(['LEAGUE', 'KNOCKOUT', 'GROUPS', 'CUSTOM', 'WEEKEND_CUP']),
      playerIds: z.array(z.string()).optional(),
      startDate: z.string().datetime().optional(),
    });
    const data = schema.parse(req.body);

    const tournament = await prisma.tournament.create({
      data: {
        leagueId: data.leagueId,
        name: data.name,
        format: data.format,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
      },
    });

    if (data.playerIds?.length) {
      await prisma.tournamentPlayer.createMany({
        data: data.playerIds.map((playerId) => ({
          tournamentId: tournament.id,
          playerId,
        })),
      });
    }

    const full = await prisma.tournament.findUnique({
      where: { id: tournament.id },
      include: { players: { include: { player: true } } },
    });

    res.status(201).json(full);
  } catch (e) {
    next(e);
  }
});

export default router;
