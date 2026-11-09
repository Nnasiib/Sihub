import { Router, type RequestHandler } from 'express';
import { Prisma, PublicationStatus, Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth, requireRole } from '../security';
import { asyncRoute, httpError } from '../utils';
import { validateCmsMediaContent } from '../cmsMediaValidation';
import { validateDynamicPageSections } from '../cmsSections';

type CmsDatabase = Pick<typeof prisma, 'cmsEntry' | 'cmsRevision' | 'auditLog'>;

export const createCmsRouter = (
  database: CmsDatabase = prisma,
  authenticate: RequestHandler = requireAuth,
  authorize: typeof requireRole = requireRole
) => {
const router = Router();
const staffRoles = [Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN] as const;
const slugSchema = z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const entrySchema = z.object({
  type: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/),
  slug: slugSchema,
  title: z.string().trim().min(1).max(240),
  summary: z.string().max(10000).optional(),
  content: z.record(z.string(), z.unknown()),
});

const recordRevision = async (entry: {
  id: string; type: string; slug: string; title: string; summary: string | null;
  content: Prisma.JsonValue; status: PublicationStatus; deletedAt: Date | null; publishedAt: Date | null;
}, authorId: string) => {
  const revisionNumber = await database.cmsRevision.count({ where: { entryId: entry.id } }) + 1;
  await database.cmsRevision.create({
    data: {
      entryId: entry.id,
      revisionNumber,
      type: entry.type,
      slug: entry.slug,
      title: entry.title,
      summary: entry.summary,
      content: entry.content as Prisma.InputJsonValue,
      status: entry.status,
      deletedAt: entry.deletedAt,
      publishedAt: entry.publishedAt,
      authorId
    }
  });
};

const stripInternalCmsFields = (content: unknown): unknown => {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return content;
  const contentObj = content as Record<string, unknown>;
  if (contentObj._published && typeof contentObj._published === 'object') {
    return contentObj._published;
  }
  const { _draft, _published, ...clean } = contentObj;
  return clean;
};

const officialNavHierarchy = [
  { key: 'home', label: 'Home', view: 'home', url: '/' },
  {
    key: 'about',
    label: 'About SiHub',
    view: 'about',
    url: '/about',
    subItems: [
      { key: 'who-we-are', label: 'Who We Are', view: 'about', anchor: 'who-we-are', url: '/about#who-we-are', desc: 'Parent ecosystem mandate & strategic identity' },
      { key: 'vision-mission', label: 'Vision & Mission', view: 'about', anchor: 'vision-mission', url: '/about#vision-mission', desc: 'Leading center for grassroots social innovation' },
      { key: 'our-team', label: 'Our Team', view: 'about', anchor: 'our-team', url: '/about#our-team', desc: 'Executive leadership & ecosystem stewards' }
    ]
  },
  {
    key: 'programmes',
    label: 'Our Programmes',
    view: 'programs',
    url: '/programs',
    subItems: [
      { key: 'digital-skills', label: 'Digital Skills Development', view: 'programs', query: { track: 'digital-skills' }, url: '/programs?track=digital-skills', desc: 'High-impact technology & workforce tracks' },
      { key: 'youth-empowerment', label: 'Youth Empowerment', view: 'programs', query: { track: 'youth-empowerment' }, url: '/programs?track=youth-empowerment', desc: 'Leadership, capacity building & pathways' },
      { key: 'social-innovation', label: 'Social Innovation', view: 'programs', query: { track: 'social-innovation' }, url: '/programs?track=social-innovation', desc: 'Grassroots community problem-solving' },
      { key: 'women-innovation', label: 'Women in Innovation', view: 'programs', query: { track: 'women-in-innovation' }, url: '/programs?track=women-in-innovation', desc: 'Gender-inclusive tech & entrepreneurship' },
      { key: 'inclusive-digital', label: 'Inclusive Digital Inclusion', view: 'programs', query: { track: 'inclusive-digital' }, url: '/programs?track=inclusive-digital', desc: 'Equitable access for all regions & backgrounds' },
      { key: 'green-sustainability', label: 'Green Innovation & Sustainability', view: 'programs', query: { track: 'green-sustainability' }, url: '/programs?track=green-sustainability', desc: 'Climate resilience, clean energy & AgriTech' },
      { key: 'youth-peace', label: 'Youth Peace Innovation', view: 'programs', query: { track: 'youth-peace' }, url: '/programs?track=youth-peace', desc: 'Community cohesion & peacebuilding solutions' },
      { key: 'community-dev', label: 'Community Development', view: 'programs', query: { track: 'community-development' }, url: '/programs?track=community-development', desc: 'Grassroots civic transformation initiatives' }
    ]
  },
  {
    key: 'startups',
    label: 'Entrepreneurship & Startups',
    view: 'startups',
    url: '/entrepreneurship',
    subItems: [
      { key: 'incubation', label: 'Startup Incubation', view: 'startups', url: '/entrepreneurship', desc: 'Seed funding, co-working & structured acceleration' },
      { key: 'entrepreneurs', label: 'Entrepreneurs', view: 'startups', url: '/entrepreneurship', desc: 'Featured Somali founders & active portfolio' },
      { key: 'youth-mentorship', label: 'Youth Mentorship', view: 'mentorship', url: '/mentorship', desc: '1-on-1 guidance from diaspora & industry leaders' },
      { key: 'startup-support', label: 'Startup Support', view: 'startups', url: '/entrepreneurship', desc: 'Legal sandboxes, prototyping labs & investor readiness' }
    ]
  },
  {
    key: 'institute',
    label: 'SiHub Institute',
    view: 'courses',
    url: '/institute',
    subItems: [
      { key: 'digital-skills-academy', label: 'Digital Skills Academy', view: 'courses', query: { category: 'technology-software' }, url: '/institute?category=technology-software', desc: 'Software engineering, cloud & modern tech' },
      { key: 'professional-training', label: 'Professional Training', view: 'courses', query: { category: 'digital-entrepreneurship' }, url: '/institute?category=digital-entrepreneurship', desc: 'Executive masterclasses & industry diplomas' },
      { key: 'ai-emerging', label: 'AI & Emerging Technologies', view: 'courses', query: { category: 'data-ai' }, url: '/institute?category=data-ai', desc: 'Machine learning, IoT & generative AI' },
      { key: 'research-innovation', label: 'Research & Innovation', view: 'innovation', url: '/innovation', desc: 'Applied R&D labs & academic publications' },
      { key: 'certification', label: 'Certification', view: 'courses', anchor: 'certification', url: '/institute#certification', desc: 'Public learning pathways and completion records' }
    ]
  },
  {
    key: 'events-media',
    label: 'Events & Media',
    view: 'events',
    url: '/events',
    subItems: [
      { key: 'sitalks', label: 'SiHub Talks (SiTalks)', view: 'events', query: { type: 'conference' }, url: '/events?type=conference', desc: 'Thought leadership panels & keynote sessions' },
      { key: 'summit', label: 'Somali Innovation Summit', view: 'events', query: { type: 'summit' }, url: '/events?type=summit', desc: 'Annual flagship Horn of Africa gathering' },
      { key: 'expo', label: 'SiHub Expo', view: 'events', query: { type: 'demoday' }, url: '/events?type=demoday', desc: 'Showcase of homegrown innovations & prototypes' },
      { key: 'news-stories', label: 'News & Stories', view: 'news', url: '/news', desc: 'Ecosystem updates, milestones & press releases' },
      { key: 'media-gallery', label: 'Media Gallery', view: 'media_gallery', url: '/media', desc: 'Event photos, video archives & highlights' }
    ]
  },
  {
    key: 'impact',
    label: 'Our Impact',
    view: 'impact',
    url: '/impact',
    subItems: [
      { key: 'success-stories', label: 'Success Stories', view: 'impact', anchor: 'our-impact', url: '/impact#our-impact', desc: 'Inspiring founder journeys & community impact' },
      { key: 'projects-achievements', label: 'Projects & Achievements', view: 'innovation', url: '/innovation', desc: 'Tangible milestones delivered across Somalia' },
      { key: 'annual-reports', label: 'Annual Reports', view: 'news', url: '/news', desc: 'Audited impact assessments & publications' },
      { key: 'community-impact', label: 'Community Impact', view: 'community', url: '/community', desc: 'Outreach metrics across regional hub stations' }
    ]
  },
  {
    key: 'partnerships',
    label: 'Partnerships',
    view: 'partnerships',
    url: '/partnerships',
    subItems: [
      { key: 'become-partner', label: 'Become a Partner', view: 'partnerships', anchor: 'become-partner', url: '/partnerships#become-partner', desc: 'Join as an academic, corporate, or civic ally' },
      { key: 'donors-supporters', label: 'Donors & Supporters', view: 'partnerships', anchor: 'donors', url: '/partnerships#donors', desc: 'Multilateral agencies, foundations & diaspora' },
      { key: 'collaboration-opportunities', label: 'Collaboration Opportunities', view: 'opportunities', url: '/opportunities', desc: 'Joint funding calls, pilot projects & research' }
    ]
  },
  {
    key: 'portal-access',
    label: 'Portal Access',
    view: 'learner_portal',
    url: '/learner',
    subItems: [
      { key: 'learner-portal', label: 'Learner Portal', view: 'learner_portal', url: '/learner', desc: 'Student coursework, assignments, and certificates' },
      { key: 'startup-portal', label: 'Startup Portal', view: 'startup_portal', url: '/founder', desc: 'Incubation metrics, founder desk, and investor decks' },
      { key: 'partner-portal', label: 'Partner Portal', view: 'partner_portal', url: '/partner', desc: 'MoUs, funding allocations, and co-sponsored cohorts' }
    ]
  }
];

router.get('/navigation', asyncRoute(async (_req, res) => {
  try {
    const entry = await database.cmsEntry.findFirst({
      where: { type: 'page', slug: 'header', status: PublicationStatus.PUBLISHED, deletedAt: null }
    });
    const content = entry?.content && typeof entry.content === 'object' && !Array.isArray(entry.content)
      ? entry.content as Record<string, unknown>
      : {};
    const categories = Array.isArray(content.categories) && content.categories.length > 0
      ? content.categories
      : officialNavHierarchy;
    res.json({ categories });
  } catch {
    res.json({ categories: officialNavHierarchy });
  }
}));

router.put('/navigation', authenticate, authorize(...staffRoles), asyncRoute(async (req, res) => {
  const navSubItemSchema: z.ZodTypeAny = z.lazy(() => z.object({
    key: z.string().trim().min(1).max(100),
    label: z.string().trim().min(1).max(200),
    view: z.string().optional(),
    url: z.string().max(2048).refine(value => {
      try { return ['http:', 'https:'].includes(new URL(value, 'https://sihub.local').protocol); } catch { return false; }
    }).optional(),
    anchor: z.string().max(200).optional(),
    desc: z.string().max(1000).optional(),
    query: z.record(z.string(), z.string()).optional(),
    visible: z.boolean().optional(),
    subItems: z.array(navSubItemSchema).max(100).optional()
  }));
  const schema = z.object({
    categories: z.array(z.object({
      key: z.string().trim().min(1).max(100),
      label: z.string().trim().min(1).max(200),
      view: z.string().optional(),
      url: z.string().max(2048).refine(value => {
        try {
          return ['http:', 'https:'].includes(new URL(value, 'https://sihub.local').protocol);
        } catch {
          return false;
        }
      }).optional(),
      visible: z.boolean().optional(),
      subItems: z.array(navSubItemSchema).max(100).optional()
    }))
  });
  const input = schema.safeParse(req.body);
  if (!input.success) throw httpError(400, 'Invalid navigation structure');

  let entry = await database.cmsEntry.findFirst({
    where: { type: 'page', slug: 'header', deletedAt: null }
  });
  if (entry) {
    await recordRevision(entry, req.authUser!.id);
    entry = await database.cmsEntry.update({
      where: { id: entry.id },
      data: {
        content: { categories: input.data.categories } as Prisma.InputJsonValue,
        status: PublicationStatus.PUBLISHED,
        publishedAt: new Date()
      }
    });
  } else {
    entry = await database.cmsEntry.create({
      data: {
        type: 'page',
        slug: 'header',
        title: 'Institutional Header Navigation',
        content: { categories: input.data.categories } as Prisma.InputJsonValue,
        status: PublicationStatus.PUBLISHED,
        publishedAt: new Date(),
        authorId: req.authUser!.id
      }
    });
  }
  await database.auditLog.create({
    data: {
      actorId: req.authUser!.id,
      action: 'CMS_NAVIGATION_UPDATE',
      entity: 'navigation',
      entityId: entry.id,
      metadata: { categoryCount: input.data.categories.length }
    }
  });
  res.json({ categories: input.data.categories, entryId: entry.id });
}));

router.get('/settings', asyncRoute(async (_req, res) => {
  const defaultSettings = {
    siteTitle: 'Somali Innovation Hub (SiHub)',
    siteMetaDesc: 'Pioneering center for grassroots innovation, digital skills, technology ventures, and social transformation in Somalia.',
    contactEmail: 'info@sihub.so',
    contactPhone: '+252 61 500 0000',
    contactAddress: 'KM4 Airport Road, Wadajir District, Mogadishu, Somalia',
    socialLinks: {},
    branding: {}
  };
  try {
    const entry = await database.cmsEntry.findFirst({
      where: { type: 'page', slug: 'settings', status: PublicationStatus.PUBLISHED, deletedAt: null }
    });
    const content = entry?.content && typeof entry.content === 'object' && !Array.isArray(entry.content)
      ? entry.content as Record<string, unknown>
      : {};
    res.json({
      siteTitle: content.siteTitle || defaultSettings.siteTitle,
      siteMetaDesc: content.siteMetaDesc || defaultSettings.siteMetaDesc,
      contactEmail: content.contactEmail || defaultSettings.contactEmail,
      contactPhone: content.contactPhone || defaultSettings.contactPhone,
      contactAddress: content.contactAddress || defaultSettings.contactAddress,
      socialLinks: content.socialLinks || defaultSettings.socialLinks,
      branding: content.branding || defaultSettings.branding
    });
  } catch {
    res.json(defaultSettings);
  }
}));

router.put('/settings', authenticate, authorize(...staffRoles), asyncRoute(async (req, res) => {
  const settingsSchema = z.object({
    siteTitle: z.string().trim().min(1).max(200).optional(),
    siteMetaDesc: z.string().max(2000).optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().max(100).optional(),
    contactAddress: z.string().max(500).optional(),
    socialLinks: z.record(z.string(), z.string()).optional(),
    branding: z.record(z.string(), z.unknown()).optional()
  });
  const input = settingsSchema.safeParse(req.body);
  if (!input.success) throw httpError(400, 'Invalid website settings');

  let entry = await database.cmsEntry.findFirst({
    where: { type: 'page', slug: 'settings', deletedAt: null }
  });
  if (entry) {
    await recordRevision(entry, req.authUser!.id);
    entry = await database.cmsEntry.update({
      where: { id: entry.id },
      data: {
        content: input.data as Prisma.InputJsonValue,
        status: PublicationStatus.PUBLISHED,
        publishedAt: new Date()
      }
    });
  } else {
    entry = await database.cmsEntry.create({
      data: {
        type: 'page',
        slug: 'settings',
        title: 'Institutional Website Settings',
        content: input.data as Prisma.InputJsonValue,
        status: PublicationStatus.PUBLISHED,
        publishedAt: new Date(),
        authorId: req.authUser!.id
      }
    });
  }
  await database.auditLog.create({
    data: {
      actorId: req.authUser!.id,
      action: 'CMS_SETTINGS_UPDATE',
      entity: 'settings',
      entityId: entry.id
    }
  });
  res.json({ settings: input.data, entryId: entry.id });
}));


router.get('/admin', authenticate, authorize(...staffRoles), asyncRoute(async (_req, res) => {
  const entries = await database.cmsEntry.findMany({ orderBy: { updatedAt: 'desc' } });
  res.json({ entries });
}));

router.post('/admin', authenticate, authorize(...staffRoles), asyncRoute(async (req, res) => {
  const input = entrySchema.safeParse(req.body);
  if (!input.success) throw httpError(400, 'Invalid content entry');
  const sectionError = validateDynamicPageSections(input.data.content);
  if (sectionError) throw httpError(400, sectionError);
  const mediaError = validateCmsMediaContent(input.data.content);
  if (mediaError) throw httpError(400, mediaError);
  const entry = await database.cmsEntry.create({
    data: { ...input.data, content: input.data.content as Prisma.InputJsonValue, status: PublicationStatus.DRAFT, authorId: req.authUser!.id }
  });
  await database.auditLog.create({ data: { actorId: req.authUser!.id, action: 'CMS_CREATE', entity: input.data.type, entityId: entry.id } });
  res.status(201).json({ entry });
}));

router.patch('/admin/:id', authenticate, authorize(...staffRoles), asyncRoute(async (req, res) => {
  const input = entrySchema.partial().extend({
    publishNow: z.boolean().optional(),
    isDraft: z.boolean().optional()
  }).safeParse(req.body);
  if (!input.success || Object.keys(input.data).length === 0) throw httpError(400, 'Invalid content update');
  if (input.data.content) {
    const sectionError = validateDynamicPageSections(input.data.content);
    if (sectionError) throw httpError(400, sectionError);
  }
  if (input.data.content) {
    const mediaError = validateCmsMediaContent(input.data.content);
    if (mediaError) throw httpError(400, mediaError);
  }
  const existing = await database.cmsEntry.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!existing) throw httpError(404, 'Content not found');
  await recordRevision(existing, req.authUser!.id);

  const isCurrentlyPublished = existing.status === PublicationStatus.PUBLISHED;
  const shouldPublishNow = input.data.publishNow === true;

  let nextStatus = existing.status;
  let nextPublishedAt = existing.publishedAt;
  let nextContent = input.data.content !== undefined ? (input.data.content as Prisma.InputJsonValue) : existing.content;

  if (isCurrentlyPublished && !shouldPublishNow) {
    // Preserve published status on the live site while recording the working draft
    nextStatus = PublicationStatus.PUBLISHED;
    const existingContentObj = (existing.content && typeof existing.content === 'object' && !Array.isArray(existing.content))
      ? existing.content as Record<string, unknown>
      : {};
    const liveContent = existingContentObj._published ?? existing.content;
    const workingDraft = input.data.content ?? existingContentObj;
    nextContent = {
      ...(typeof liveContent === 'object' && !Array.isArray(liveContent) ? liveContent : {}),
      _published: liveContent,
      _draft: {
        content: workingDraft,
        title: input.data.title ?? existing.title,
        summary: input.data.summary ?? existing.summary,
        savedAt: new Date().toISOString(),
        authorId: req.authUser!.id
      }
    } as Prisma.InputJsonValue;
  } else if (shouldPublishNow) {
    nextStatus = PublicationStatus.PUBLISHED;
    nextPublishedAt = new Date();
    const contentObj = (input.data.content ?? existing.content) as Record<string, unknown>;
    const { _draft: _discardDraft, _published: _discardPub, ...cleanContent } = contentObj && typeof contentObj === 'object' ? contentObj : {};
    nextContent = cleanContent as Prisma.InputJsonValue;
  } else {
    nextStatus = PublicationStatus.DRAFT;
    nextPublishedAt = null;
  }

  const data: Prisma.CmsEntryUpdateInput = {
    ...(input.data.type !== undefined ? { type: input.data.type } : {}),
    ...(input.data.slug !== undefined ? { slug: input.data.slug } : {}),
    ...(input.data.title !== undefined ? { title: input.data.title } : {}),
    ...(input.data.summary !== undefined ? { summary: input.data.summary } : {}),
    content: nextContent,
    status: nextStatus,
    publishedAt: nextPublishedAt
  };
  const entry = await database.cmsEntry.update({
    where: { id: req.params.id, deletedAt: null },
    data
  });
  await database.auditLog.create({ data: { actorId: req.authUser!.id, action: shouldPublishNow ? 'CMS_PUBLISHED' : 'CMS_UPDATE', entity: entry.type, entityId: entry.id } });
  res.json({ entry });
}));

router.patch('/admin/:id/status', authenticate, authorize(...staffRoles), asyncRoute(async (req, res) => {
  const input = z.object({ status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'REJECTED', 'ARCHIVED']), reason: z.string().max(2000).optional() }).safeParse(req.body);
  if (!input.success) throw httpError(400, 'Invalid publication status');
  const existing = await database.cmsEntry.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!existing) throw httpError(404, 'Content not found');
  const allowedTransitions: Record<PublicationStatus, PublicationStatus[]> = {
    DRAFT: [PublicationStatus.PENDING_APPROVAL, PublicationStatus.ARCHIVED],
    PENDING_APPROVAL: [PublicationStatus.APPROVED, PublicationStatus.REJECTED, PublicationStatus.ARCHIVED],
    APPROVED: [PublicationStatus.PUBLISHED, PublicationStatus.REJECTED, PublicationStatus.ARCHIVED],
    PUBLISHED: [PublicationStatus.DRAFT, PublicationStatus.ARCHIVED],
    REJECTED: [PublicationStatus.PENDING_APPROVAL, PublicationStatus.ARCHIVED],
    ARCHIVED: []
  };
  if (!allowedTransitions[existing.status].includes(input.data.status)) throw httpError(409, `Cannot move content from ${existing.status} to ${input.data.status}`);
  await recordRevision(existing, req.authUser!.id);

  let nextContent: Prisma.InputJsonValue = existing.content as unknown as Prisma.InputJsonValue;
  if (input.data.status === PublicationStatus.PUBLISHED) {
    const contentObj = (existing.content && typeof existing.content === 'object' && !Array.isArray(existing.content))
      ? existing.content as Record<string, unknown>
      : {};
    const draftData = contentObj._draft as { content?: unknown } | undefined;
    if (draftData && draftData.content) {
      const draftContentObj = draftData.content as Record<string, unknown>;
      const { _draft: _d, _published: _p, ...cleanDraft } = draftContentObj;
      nextContent = cleanDraft as unknown as Prisma.InputJsonValue;
    } else {
      const { _draft: _d, _published: _p, ...clean } = contentObj;
      nextContent = clean as unknown as Prisma.InputJsonValue;
    }
  }

  const entry = await database.cmsEntry.update({
    where: { id: existing.id },
    data: {
      status: input.data.status,
      content: nextContent as Prisma.InputJsonValue,
      publishedAt: input.data.status === 'PUBLISHED' ? new Date() : null
    }
  });
  await database.auditLog.create({ data: { actorId: req.authUser!.id, action: `CMS_${input.data.status}`, entity: entry.type, entityId: entry.id, metadata: { reason: input.data.reason ?? null } } });
  res.json({ entry });
}));

router.post('/admin/:id/discard-draft', authenticate, authorize(...staffRoles), asyncRoute(async (req, res) => {
  const existing = await database.cmsEntry.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!existing) throw httpError(404, 'Content not found');
  const contentObj = (existing.content && typeof existing.content === 'object' && !Array.isArray(existing.content))
    ? existing.content as Record<string, unknown>
    : {};
  const liveContent = (contentObj._published ?? existing.content) as Record<string, unknown>;
  const { _draft: _d, _published: _p, ...cleanLive } = liveContent && typeof liveContent === 'object' ? liveContent : {};
  const entry = await database.cmsEntry.update({
    where: { id: existing.id },
    data: { content: cleanLive as Prisma.InputJsonValue }
  });
  await database.auditLog.create({ data: { actorId: req.authUser!.id, action: 'CMS_DISCARD_DRAFT', entity: entry.type, entityId: entry.id } });
  res.json({ entry });
}));

router.delete('/admin/:id', authenticate, authorize(...staffRoles), asyncRoute(async (req, res) => {
  const existing = await database.cmsEntry.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!existing) throw httpError(404, 'Content not found');
  await recordRevision(existing, req.authUser!.id);
  const entry = await database.cmsEntry.update({ where: { id: req.params.id, deletedAt: null }, data: { deletedAt: new Date(), status: PublicationStatus.ARCHIVED } });
  await database.auditLog.create({ data: { actorId: req.authUser!.id, action: 'CMS_SOFT_DELETE', entity: entry.type, entityId: entry.id } });
  res.status(204).end();
}));

router.post('/admin/:id/restore', authenticate, authorize(...staffRoles), asyncRoute(async (req, res) => {
  const existing = await database.cmsEntry.findUnique({ where: { id: req.params.id } });
  if (!existing || (!existing.deletedAt && existing.status !== PublicationStatus.ARCHIVED)) throw httpError(404, 'Archived content not found');
  await recordRevision(existing, req.authUser!.id);
  const entry = await database.cmsEntry.update({
    where: { id: existing.id },
    data: { deletedAt: null, status: PublicationStatus.DRAFT, publishedAt: null }
  });
  await database.auditLog.create({ data: { actorId: req.authUser!.id, action: 'CMS_RESTORE', entity: entry.type, entityId: entry.id } });
  res.json({ entry });
}));

router.get('/admin/revisions', authenticate, authorize(...staffRoles), asyncRoute(async (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
  const entryId = req.query.entryId ? String(req.query.entryId) : undefined;
  const type = req.query.type ? String(req.query.type) : undefined;
  const where: any = {};
  if (entryId) where.entryId = entryId;
  if (type) where.type = type;

  const [revisions, total] = await Promise.all([
    database.cmsRevision.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: { select: { id: true, fullName: true, email: true } },
        entry: { select: { id: true, title: true, slug: true, type: true } }
      }
    }),
    database.cmsRevision.count({ where })
  ]);
  res.json({ revisions, total, page, limit });
}));

router.post('/admin/revisions/:revisionId/rollback', authenticate, authorize(...staffRoles), asyncRoute(async (req, res) => {
  const revision = await database.cmsRevision.findUnique({ where: { id: req.params.revisionId } });
  if (!revision) throw httpError(404, 'Content revision not found');
  const existing = await database.cmsEntry.findUnique({ where: { id: revision.entryId } });
  if (!existing) throw httpError(404, 'Associated CMS entry not found');

  await recordRevision(existing, req.authUser!.id);
  const entry = await database.cmsEntry.update({
    where: { id: existing.id },
    data: {
      type: revision.type,
      slug: revision.slug,
      title: revision.title,
      summary: revision.summary,
      content: revision.content as Prisma.InputJsonValue,
      status: revision.status,
      deletedAt: null,
      publishedAt: revision.publishedAt
    }
  });

  await database.auditLog.create({
    data: {
      actorId: req.authUser!.id,
      action: 'CMS_REVISION_ROLLBACK',
      entity: entry.type,
      entityId: entry.id,
      metadata: { revisionNumber: revision.revisionNumber, targetRevisionId: revision.id }
    }
  });

  res.json({ entry, restoredRevisionNumber: revision.revisionNumber });
}));

router.get('/admin/:id/revisions', authenticate, authorize(...staffRoles), asyncRoute(async (req, res) => {
  const revisions = await database.cmsRevision.findMany({ where: { entryId: req.params.id }, orderBy: { revisionNumber: 'desc' } });
  res.json({ revisions });
}));

router.post('/admin/:id/revisions/:revisionId/restore', authenticate, authorize(...staffRoles), asyncRoute(async (req, res) => {
  const revision = await database.cmsRevision.findFirst({ where: { id: req.params.revisionId, entryId: req.params.id } });
  if (!revision) throw httpError(404, 'Content revision not found');
  const existing = await database.cmsEntry.findUnique({ where: { id: req.params.id } });
  if (!existing) throw httpError(404, 'Content not found');
  await recordRevision(existing, req.authUser!.id);
  const entry = await database.cmsEntry.update({
    where: { id: existing.id },
    data: {
      type: revision.type,
      slug: revision.slug,
      title: revision.title,
      summary: revision.summary,
      content: revision.content as Prisma.InputJsonValue,
      status: PublicationStatus.DRAFT,
      deletedAt: null,
      publishedAt: null
    }
  });
  await database.auditLog.create({ data: { actorId: req.authUser!.id, action: 'CMS_REVISION_RESTORE', entity: entry.type, entityId: entry.id, metadata: { revisionNumber: revision.revisionNumber } } });
  res.json({ entry });
}));

router.get('/:type/:slug', asyncRoute(async (req, res) => {
  try {
    const entry = await database.cmsEntry.findFirst({ where: { type: req.params.type, slug: req.params.slug, status: PublicationStatus.PUBLISHED, deletedAt: null } });
    if (!entry) throw httpError(404, 'Content not found');
    res.json({
      entry: {
        ...entry,
        content: stripInternalCmsFields(entry.content)
      }
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error && error.status === 404) throw error;
    res.status(404).json({ error: 'Content not found' });
  }
}));

router.get('/:type', asyncRoute(async (req, res) => {
  try {
    const entries = await database.cmsEntry.findMany({ where: { type: req.params.type, status: PublicationStatus.PUBLISHED, deletedAt: null }, orderBy: { publishedAt: 'desc' } });
    res.json({
      entries: entries.map(entry => ({
        ...entry,
        content: stripInternalCmsFields(entry.content)
      }))
    });
  } catch {
    res.json({ entries: [] });
  }
}));

return router;
};

export default createCmsRouter();
