import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export type ResetTokenRecord = {
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date | null;
};

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export const generatePasswordResetToken = () => {
  const rawToken = randomBytes(32).toString('hex');
  return {
    rawToken,
    tokenHash: hashToken(rawToken)
  };
};

export const matchesPasswordResetToken = (providedToken: string, record: Pick<ResetTokenRecord, 'tokenHash'>) => {
  const providedHash = Buffer.from(hashToken(providedToken));
  const storedHash = Buffer.from(record.tokenHash);
  return providedHash.length === storedHash.length && timingSafeEqual(providedHash, storedHash);
};

export const isPasswordResetTokenUsable = (record: Pick<ResetTokenRecord, 'expiresAt' | 'usedAt'>, now = new Date()) => {
  if (record.usedAt) return false;
  return record.expiresAt > now;
};

export const buildPasswordResetUrl = (baseUrl: string, token: string) => `${baseUrl.replace(/\/$/, '')}?token=${encodeURIComponent(token)}`;
