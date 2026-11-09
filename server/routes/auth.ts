import { randomBytes } from 'node:crypto';
import { Router, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../db';
import { asyncRoute, httpError } from '../utils';
import { CSRF_COOKIE, hashToken, makeCsrfToken, requireAuth, requireCsrf, SESSION_COOKIE } from '../security';
import { hashPassword, verifyPasswordHash } from '../auth/password';
import { buildPasswordResetUrl, generatePasswordResetToken, isPasswordResetTokenUsable, matchesPasswordResetToken } from '../auth/passwordReset';

const router = Router();
const credentialsSchema = z.object({
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  password: z.string().min(12).max(128),
  fullName: z.string().trim().min(2).max(120).optional()
});
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
const resetLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });
const cookieOptions = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

router.get('/csrf', asyncRoute(async (req, res) => {
  const token = makeCsrfToken();
  const rawSession = req.cookies?.[SESSION_COOKIE];
  if (rawSession) {
    await prisma.session.updateMany({ where: { id: hashToken(rawSession), expiresAt: { gt: new Date() } }, data: { csrfHash: hashToken(token) } });
  }
  res.cookie(CSRF_COOKIE, token, { ...cookieOptions, httpOnly: false, maxAge: 12 * 60 * 60 * 1000 });
  res.json({ csrfToken: token });
}));

router.use(requireCsrf);

const createSession = async (userId: string, res: Response) => {
  const rawToken = randomBytes(32).toString('base64url');
  const csrfToken = makeCsrfToken();
  const ttlHours = Math.max(1, Math.min(24 * 30, Number(process.env.SESSION_TTL_HOURS) || 12));
  await prisma.session.create({
    data: {
      id: hashToken(rawToken),
      csrfHash: hashToken(csrfToken),
      userId,
      expiresAt: new Date(Date.now() + ttlHours * 60 * 60 * 1000)
    }
  });
  res.cookie(SESSION_COOKIE, rawToken, { ...cookieOptions, maxAge: ttlHours * 60 * 60 * 1000 });
  res.cookie(CSRF_COOKIE, csrfToken, { ...cookieOptions, httpOnly: false, maxAge: ttlHours * 60 * 60 * 1000 });
};

const sendPasswordResetEmail = async (user: { email: string; fullName: string }, token: string) => {
  const provider = (process.env.EMAIL_PROVIDER ?? 'none').toLowerCase();
  const from = process.env.EMAIL_FROM ?? '';
  const resetBaseUrl = (process.env.RESET_BASE_URL ?? 'http://localhost:3000/reset-password').trim();
  const resetUrl = buildPasswordResetUrl(resetBaseUrl, token);

  if (provider !== 'api' || !from || !resetBaseUrl) {
    return false;
  }

  const apiUrl = process.env.EMAIL_API_URL?.trim();
  if (!apiUrl) return false;
  try {
    const parsedApiUrl = new URL(apiUrl);
    const parsedResetUrl = new URL(resetBaseUrl);
    if (process.env.NODE_ENV === 'production' && (parsedApiUrl.protocol !== 'https:' || parsedResetUrl.protocol !== 'https:')) return false;
  } catch {
    return false;
  }

  const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
  const safeName = escapeHtml(user.fullName);
  const safeResetUrl = escapeHtml(resetUrl);
  const payload = {
    from,
    to: user.email,
    subject: 'SiHub password reset',
    text: `Hi ${user.fullName},\n\nUse the following link to reset your SiHub password:\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>Hi ${safeName},</p><p>Use the following link to reset your SiHub password:</p><p><a href="${safeResetUrl}">${safeResetUrl}</a></p><p>If you did not request this, you can ignore this email.</p>`
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.EMAIL_API_KEY ? { Authorization: `Bearer ${process.env.EMAIL_API_KEY}` } : {})
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000)
  });

  return response.ok;
};

router.post('/register', authLimiter, asyncRoute(async (req, res) => {
  const parsed = credentialsSchema.extend({ fullName: z.string().trim().min(2).max(120) }).safeParse(req.body);
  if (!parsed.success) throw httpError(400, 'Invalid registration details');
  const { email, password, fullName } = parsed.data;
  const passwordHash = await hashPassword(password);
  try {
    const user = await prisma.user.create({ data: { email, fullName, passwordHash, role: Role.STUDENT } });
    await createSession(user.id, res);
    res.status(201).json({ user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } });
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') throw httpError(409, 'An account with this email already exists');
    throw error;
  }
}));

router.post('/login', authLimiter, asyncRoute(async (req, res) => {
  const parsed = credentialsSchema.pick({ email: true, password: true }).safeParse(req.body);
  if (!parsed.success) throw httpError(400, 'Invalid email or password');
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  const validPassword = user ? await verifyPasswordHash(user.passwordHash, parsed.data.password) : false;
  if (!user || !validPassword || !user.isActive) throw httpError(401, 'Invalid email or password');
  await createSession(user.id, res);
  res.json({ user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } });
}));

router.post('/forgot-password', resetLimiter, asyncRoute(async (req, res) => {
  const parsed = z.object({ email: z.string().trim().email().max(254).transform(value => value.toLowerCase()) }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(200).json({ message: 'If an account exists for this email, a password reset link has been sent.' });
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (user && user.isActive) {
    const tokenData = generatePasswordResetToken();
    const ttlMinutes = Number(process.env.RESET_TOKEN_TTL_MINUTES) || 30;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: tokenData.tokenHash,
        expiresAt,
      }
    });

    let delivered = false;
    try {
      delivered = await sendPasswordResetEmail({ email: user.email, fullName: user.fullName }, tokenData.rawToken);
    } catch {
      delivered = false;
    }
    if (!delivered) {
      await prisma.passwordResetToken.updateMany({ where: { tokenHash: tokenData.tokenHash, usedAt: null }, data: { usedAt: new Date() } });
    }
  }

  return res.status(200).json({ message: 'If an account exists for this email, a password reset link has been sent.' });
}));

router.post('/reset-password', resetLimiter, asyncRoute(async (req, res) => {
  const parsed = z.object({
    token: z.string().trim().min(16).max(512),
    password: z.string().min(12).max(128)
  }).safeParse(req.body);

  if (!parsed.success) {
    throw httpError(400, 'This password reset link is invalid or has expired.');
  }

  const tokenHash = hashToken(parsed.data.token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true }
  });

  if (!record || !record.user || !record.user.isActive || !matchesPasswordResetToken(parsed.data.token, record) || !isPasswordResetTokenUsable(record, new Date())) {
    throw httpError(400, 'This password reset link is invalid or has expired.');
  }

  const newPasswordHash = await hashPassword(parsed.data.password);

  await prisma.$transaction(async transaction => {
    const now = new Date();
    const consumed = await transaction.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now }
    });
    if (consumed.count !== 1) throw httpError(400, 'This password reset link is invalid or has expired.');
    await transaction.passwordResetToken.updateMany({ where: { userId: record.userId, usedAt: null }, data: { usedAt: now } });
    await transaction.user.update({ where: { id: record.userId }, data: { passwordHash: newPasswordHash } });
    await transaction.session.deleteMany({ where: { userId: record.userId } });
  });

  return res.status(200).json({ message: 'Your password has been updated successfully.' });
}));

router.post('/change-password', requireAuth, resetLimiter, asyncRoute(async (req, res) => {
  const parsed = z.object({
    currentPassword: z.string().min(12).max(128),
    newPassword: z.string().min(12).max(128)
  }).safeParse(req.body);

  if (!parsed.success) {
    throw httpError(400, 'Current and new password values are required.');
  }

  const user = await prisma.user.findUnique({ where: { id: req.authUser!.id } });
  if (!user) throw httpError(404, 'Account not found.');

  const currentPasswordMatches = await verifyPasswordHash(user.passwordHash, parsed.data.currentPassword);
  if (!currentPasswordMatches) {
    throw httpError(401, 'Current password is incorrect.');
  }

  if (parsed.data.currentPassword === parsed.data.newPassword) {
    throw httpError(400, 'The new password must be different from the current password.');
  }

  const newPasswordHash = await hashPassword(parsed.data.newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash: newPasswordHash } }),
    prisma.session.deleteMany({ where: { userId: user.id, id: { not: req.sessionKey } } })
  ]);

  return res.status(200).json({ message: 'Your password has been updated successfully.' });
}));

router.get('/me', requireAuth, (req, res) => {
  const { id, email, fullName, role } = req.authUser!;
  res.json({ user: { id, email, fullName, role } });
});

router.post('/logout', requireAuth, asyncRoute(async (req, res) => {
  await prisma.session.deleteMany({ where: { id: req.sessionKey } });
  res.clearCookie(SESSION_COOKIE, cookieOptions);
  res.clearCookie(CSRF_COOKIE, { ...cookieOptions, httpOnly: false });
  res.status(204).end();
}));

export default router;
