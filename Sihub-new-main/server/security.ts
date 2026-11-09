import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Request, RequestHandler } from 'express';
import { Role } from '@prisma/client';
import { prisma } from './db';
import { httpError } from './utils';

export const SESSION_COOKIE = 'sihub_session';
export const CSRF_COOKIE = 'sihub_csrf';
const secret = process.env.SESSION_SECRET ?? (process.env.NODE_ENV === 'production' ? '' : 'development-sihub-session-secret-change-me-1234567890');

if (secret.length < 32) {
  throw new Error('SESSION_SECRET must contain at least 32 characters');
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser;
      sessionKey?: string;
    }
  }
}

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export const makeCsrfToken = () => {
  const nonce = randomBytes(32).toString('base64url');
  const signature = createHmac('sha256', secret).update(nonce).digest('base64url');
  return `${nonce}.${signature}`;
};

const safeEqual = (left: string, right: string) => {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
};

const isSignedCsrfToken = (token: string) => {
  const [nonce, signature, extra] = token.split('.');
  if (!nonce || !signature || extra) return false;
  const expected = createHmac('sha256', secret).update(nonce).digest('base64url');
  return safeEqual(signature, expected);
};

export const requireCsrf: RequestHandler = async (req, _res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  try {
    const cookieToken = req.cookies?.[CSRF_COOKIE];
    const headerToken = req.get('x-csrf-token');
    if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken) || !isSignedCsrfToken(cookieToken)) {
      throw httpError(403, 'Invalid CSRF token');
    }

    const rawSession = req.cookies?.[SESSION_COOKIE];
    if (rawSession) {
      const sessionKey = hashToken(rawSession);
      const session = await prisma.session.findUnique({ where: { id: sessionKey }, select: { csrfHash: true, expiresAt: true } });
      if (!session || session.expiresAt <= new Date() || !safeEqual(session.csrfHash, hashToken(cookieToken))) {
        throw httpError(403, 'Invalid CSRF session');
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = req.cookies?.[SESSION_COOKIE];
    if (!token) throw httpError(401, 'Authentication required');
    const key = hashToken(token);
    const session = await prisma.session.findUnique({ where: { id: key }, include: { user: true } });
    if (!session || session.expiresAt <= new Date() || !session.user.isActive) {
      if (session) await prisma.session.delete({ where: { id: key } });
      throw httpError(401, 'Session expired or inactive');
    }
    req.authUser = session.user;
    req.sessionKey = key;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (...roles: Role[]): RequestHandler => (req, _res, next) => {
  if (!req.authUser) return next(httpError(401, 'Authentication required'));
  if (!roles.includes(req.authUser.role)) return next(httpError(403, 'Insufficient permissions'));
  next();
};

export const isStaff = (user: AuthenticatedUser | undefined) => Boolean(user && ([Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN, Role.EDUCATION_MANAGER] as Role[]).includes(user.role));
