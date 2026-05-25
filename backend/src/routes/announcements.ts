import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, optionalAuth } from '../middleware/auth';
import type { Server as SocketServer } from 'socket.io';

export function createAnnouncementRoutes(io: SocketServer) {
  const router = Router();

  router.get('/league/:leagueId', optionalAuth, async (req, res, next) => {
    try {
      const items = await prisma.announcement.findMany({
        where: { leagueId: req.params.leagueId },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, avatar: true } } },
      });
      res.json(items);
    } catch (e) {
      next(e);
    }
  });

  router.post('/', authenticate, async (req, res, next) => {
    try {
      const schema = z.object({
        leagueId: z.string(),
        title: z.string(),
        content: z.string(),
      });
      const data = schema.parse(req.body);
      const announcement = await prisma.announcement.create({
        data: { ...data, userId: req.user!.userId },
        include: { user: { select: { name: true } } },
      });
      io.to(`league:${data.leagueId}`).emit('announcement:new', announcement);
      res.status(201).json(announcement);
    } catch (e) {
      next(e);
    }
  });

  return router;
}
