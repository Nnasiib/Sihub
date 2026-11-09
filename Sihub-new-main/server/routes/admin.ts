import { Router } from 'express';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth, requireRole } from '../security';
import { asyncRoute, httpError } from '../utils';

const router = Router();
const staffRoles = [Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN] as const;
const elevatedRoles: Role[] = [Role.OWNER, Role.SUPER_ADMIN];
const publicUser = ({ passwordHash: _passwordHash, ...user }: { passwordHash: string; [key: string]: unknown }) => user;

router.get('/users', requireAuth, requireRole(...staffRoles), asyncRoute(async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ users: users.map(user => publicUser(user)) });
}));

router.patch('/users/:userId', requireAuth, requireRole(...staffRoles), asyncRoute(async (req, res) => {
  const input = z.object({ role: z.nativeEnum(Role).optional(), isActive: z.boolean().optional(), fullName: z.string().trim().min(2).max(120).optional() }).safeParse(req.body);
  if (!input.success || !Object.keys(input.data).length) throw httpError(400, 'Invalid user update');
  const target = await prisma.user.findUnique({ where: { id: req.params.userId } });
  if (!target) throw httpError(404, 'User not found');
  if (input.data.role && target.id === req.authUser!.id && input.data.role !== target.role) throw httpError(403, 'You cannot change your own role');
  if (input.data.role && !elevatedRoles.includes(req.authUser!.role)) {
    const assignable: Role[] = [Role.STUDENT, Role.LEARNER, Role.INSTRUCTOR, Role.STARTUP_FOUNDER, Role.MENTOR, Role.COMMUNITY_MEMBER, Role.PARTNER, Role.VISITOR];
    if (!assignable.includes(input.data.role)) throw httpError(403, 'Only an owner or super administrator may assign privileged roles');
    if (([Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN, Role.EDUCATION_MANAGER] as Role[]).includes(target.role)) throw httpError(403, 'Only an owner or super administrator may change this account');
  }
  if (target.role === Role.OWNER && req.authUser!.role !== Role.OWNER) throw httpError(403, 'Only the owner may change the owner account');
  if (req.authUser!.role === Role.SUPER_ADMIN && input.data.role === Role.OWNER) throw httpError(403, 'A super administrator cannot assign owner privileges');
  const updated = await prisma.user.update({ where: { id: target.id }, data: input.data });
  await prisma.auditLog.create({ data: { actorId: req.authUser!.id, action: 'USER_ADMIN_UPDATE', entity: 'User', entityId: updated.id, metadata: { changedRole: input.data.role ?? null, changedStatus: input.data.isActive ?? null } } });
  res.json({ user: publicUser(updated) });
}));

router.get('/audit', requireAuth, requireRole(...staffRoles), asyncRoute(async (req, res) => {
  const input = z.coerce.number().int().min(1).max(200).catch(100).parse(req.query.limit);
  const entries = await prisma.auditLog.findMany({ take: input, orderBy: { createdAt: 'desc' }, include: { actor: { select: { id: true, email: true, fullName: true, role: true } } } });
  res.json({ entries });
}));

export default router;
