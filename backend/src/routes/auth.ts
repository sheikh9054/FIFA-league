import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { getJwtSecret } from '../config/env';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function signToken(payload: { userId: string; email?: string; role: string; isGuest?: boolean }) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(data.password, 10);
    const userCount = await prisma.user.count();
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
        role: userCount === 0 ? 'ADMIN' : 'USER',
      },
    });

    const token = signToken({ userId: user.id, email: user.email!, role: user.role });
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (e) {
    next(e);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user?.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ userId: user.id, email: user.email!, role: user.role });
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar },
    });
  } catch (e) {
    next(e);
  }
});

router.post('/guest', async (req, res, next) => {
  try {
    const name = (req.body.name as string) || `Guest_${Date.now().toString(36)}`;
    const user = await prisma.user.create({
      data: {
        name,
        role: 'GUEST',
        isGuest: true,
        guestExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const token = signToken({
      userId: user.id,
      role: 'GUEST',
      isGuest: true,
    });

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, role: user.role, isGuest: true },
    });
  } catch (e) {
    next(e);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true, role: true, avatar: true, isGuest: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    next(e);
  }
});

export default router;
