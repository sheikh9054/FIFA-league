import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth';
import { generateRoundRobin, generateKnockoutPairings, generateGroupFixtures } from '../utils/fixtures';

const router = Router();

router.get('/league/:leagueId', optionalAuth, async (req, res, next) => {
  try {
    const { matchday } = req.query;
    const fixtures = await prisma.fixture.findMany({
      where: {
        leagueId: req.params.leagueId,
        ...(matchday ? { matchday: parseInt(matchday as string, 10) } : {}),
      },
      orderBy: [{ matchday: 'asc' }, { scheduledAt: 'asc' }],
    });

    const playerIds = new Set<string>();
    fixtures.forEach((f) => {
      playerIds.add(f.homePlayerId);
      playerIds.add(f.awayPlayerId);
    });

    const players = await prisma.player.findMany({
      where: { id: { in: [...playerIds] } },
    });
    const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));

    res.json(
      fixtures.map((f) => ({
        ...f,
        homePlayer: playerMap[f.homePlayerId],
        awayPlayer: playerMap[f.awayPlayerId],
      }))
    );
  } catch (e) {
    next(e);
  }
});

router.post('/generate', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const schema = z.object({
      leagueId: z.string(),
      format: z.enum(['round_robin', 'knockout', 'groups']),
      playerIds: z.array(z.string()).min(2),
      groupSize: z.number().optional(),
      startDate: z.string().datetime().optional(),
    });
    const data = schema.parse(req.body);

    await prisma.fixture.deleteMany({
      where: { leagueId: data.leagueId, status: 'SCHEDULED' },
    });

    let fixturePairs: { homePlayerId: string; awayPlayerId: string; matchday: number }[] = [];

    if (data.format === 'round_robin') {
      fixturePairs = generateRoundRobin(data.playerIds);
    } else if (data.format === 'knockout') {
      fixturePairs = generateKnockoutPairings(data.playerIds);
    } else {
      const groups = generateGroupFixtures(data.playerIds, data.groupSize || 4);
      fixturePairs = groups.flatMap((g) => g.fixtures);
    }

    const baseDate = data.startDate ? new Date(data.startDate) : new Date();
    const created = await prisma.fixture.createMany({
      data: fixturePairs.map((f, i) => ({
        leagueId: data.leagueId,
        homePlayerId: f.homePlayerId,
        awayPlayerId: f.awayPlayerId,
        matchday: f.matchday,
        scheduledAt: new Date(baseDate.getTime() + (f.matchday - 1) * 7 * 24 * 60 * 60 * 1000 + i * 3600000),
        status: 'SCHEDULED',
      })),
    });

    res.status(201).json({ count: created.count, matchdays: [...new Set(fixturePairs.map((f) => f.matchday))].length });
  } catch (e) {
    next(e);
  }
});

router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const schema = z.object({
      leagueId: z.string(),
      homePlayerId: z.string(),
      awayPlayerId: z.string(),
      matchday: z.number(),
      scheduledAt: z.string().datetime().optional(),
    });
    const data = schema.parse(req.body);
    const fixture = await prisma.fixture.create({ data: { ...data, scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined } });
    res.status(201).json(fixture);
  } catch (e) {
    next(e);
  }
});

export default router;
