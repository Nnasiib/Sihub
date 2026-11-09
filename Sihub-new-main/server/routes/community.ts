import { Router, type Request } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../db';
import { SESSION_COOKIE, hashToken, requireAuth } from '../security';
import { asyncRoute, httpError } from '../utils';

const router = Router();
const reactionLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 90, standardHeaders: true, legacyHeaders: false });

const publishedTopic = async (topicId: string) => {
  const entry = await prisma.cmsEntry.findFirst({
    where: { type: 'community-topic', status: 'PUBLISHED', deletedAt: null, OR: [{ id: topicId }, { legacyId: topicId }] },
    select: { id: true }
  });
  if (!entry) throw httpError(404, 'Community topic not found');
  return entry;
};

const currentUserId = async (req: Request) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { id: hashToken(token) }, select: { userId: true, expiresAt: true, user: { select: { isActive: true } } } });
  return session && session.expiresAt > new Date() && session.user.isActive ? session.userId : null;
};

router.get('/topics/:topicId/reactions', reactionLimiter, asyncRoute(async (req, res) => {
  const entry = await publishedTopic(req.params.topicId);
  const userId = await currentUserId(req);
  const [count, reaction] = await Promise.all([
    prisma.communityReaction.count({ where: { entryId: entry.id } }),
    userId ? prisma.communityReaction.findUnique({ where: { entryId_userId: { entryId: entry.id, userId } }, select: { id: true } }) : null
  ]);
  res.json({ count, hasReacted: Boolean(reaction) });
}));

router.post('/topics/:topicId/reactions', reactionLimiter, requireAuth, asyncRoute(async (req, res) => {
  const entry = await publishedTopic(req.params.topicId);
  const reaction = await prisma.communityReaction.upsert({
    where: { entryId_userId: { entryId: entry.id, userId: req.authUser!.id } },
    create: { entryId: entry.id, userId: req.authUser!.id },
    update: {}
  });
  const count = await prisma.communityReaction.count({ where: { entryId: entry.id } });
  res.json({ count, hasReacted: true, reactionId: reaction.id });
}));

router.delete('/topics/:topicId/reactions', reactionLimiter, requireAuth, asyncRoute(async (req, res) => {
  const entry = await publishedTopic(req.params.topicId);
  await prisma.communityReaction.deleteMany({ where: { entryId: entry.id, userId: req.authUser!.id } });
  const count = await prisma.communityReaction.count({ where: { entryId: entry.id } });
  res.json({ count, hasReacted: false });
}));

export default router;
