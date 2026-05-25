import { Router } from 'express';
import { optionalAuth } from '../middleware/auth';
import { getLeagueStats } from '../services/statsService';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/:leagueId', optionalAuth, async (req, res, next) => {
  try {
    const stats = await getLeagueStats(req.params.leagueId);
    res.json(stats);
  } catch (e) {
    next(e);
  }
});

router.get('/:leagueId/elo-history/:playerId', optionalAuth, async (req, res, next) => {
  try {
    const history = await prisma.eloHistory.findMany({
      where: { playerId: req.params.playerId },
      orderBy: { createdAt: 'asc' },
    });
    res.json(history);
  } catch (e) {
    next(e);
  }
});

router.get('/:leagueId/activity', optionalAuth, async (req, res, next) => {
  try {
    const activities = await prisma.activity.findMany({
      where: { leagueId: req.params.leagueId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    res.json(activities);
  } catch (e) {
    next(e);
  }
});

export default router;
