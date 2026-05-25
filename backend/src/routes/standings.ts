import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { optionalAuth } from '../middleware/auth';
import { getLeagueStats } from '../services/statsService';

const router = Router();

router.get('/:leagueId', optionalAuth, async (req, res, next) => {
  try {
    const stats = await getLeagueStats(req.params.leagueId);
    res.json(stats.standings);
  } catch (e) {
    next(e);
  }
});

router.get('/:leagueId/full', optionalAuth, async (req, res, next) => {
  try {
    const stats = await getLeagueStats(req.params.leagueId);
    res.json(stats);
  } catch (e) {
    next(e);
  }
});

export default router;
