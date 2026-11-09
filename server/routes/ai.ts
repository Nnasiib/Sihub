import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { GoogleGenAI } from '@google/genai';
import { Prisma, PublicationStatus, Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth, requireRole } from '../security';
import { asyncRoute, httpError } from '../utils';

const router = Router();
const staffRoles = [Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN] as const;
const chatLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
const faqSchema = z.object({
  id: z.string().trim().min(1).max(100),
  question: z.string().trim().min(3).max(500),
  answer: z.string().trim().min(3).max(5000)
});
const configSchema = z.object({
  model: z.enum(['gemini-2.5-flash', 'gemini-2.5-pro']),
  temperature: z.number().min(0).max(1),
  systemPrompt: z.string().trim().min(20).max(10000),
  knowledgeBase: z.array(faqSchema).max(100)
});
const defaultConfig = {
  model: 'gemini-2.5-flash' as const,
  temperature: 0.4,
  systemPrompt: 'You are the SiHub public information assistant. Use only the verified SiHub content and FAQs provided with the request. Do not invent dates, grants, eligibility rules, statistics, or services. When information is unavailable, say so and direct the visitor to the relevant SiHub page.',
  knowledgeBase: [] as z.infer<typeof faqSchema>[]
};

const readConfig = async () => {
  const entry = await prisma.cmsEntry.findFirst({ where: { type: 'ai-config', slug: 'assistant', deletedAt: null } });
  const content = entry?.content && typeof entry.content === 'object' && !Array.isArray(entry.content)
    ? entry.content as Record<string, unknown>
    : {};
  const parsed = configSchema.safeParse({
    model: content.model ?? defaultConfig.model,
    temperature: content.temperature ?? defaultConfig.temperature,
    systemPrompt: content.systemPrompt ?? defaultConfig.systemPrompt,
    knowledgeBase: content.knowledgeBase ?? defaultConfig.knowledgeBase
  });
  return {
    entry,
    config: parsed.success ? parsed.data : defaultConfig,
    providerConfigured: Boolean(process.env.GEMINI_API_KEY?.trim())
  };
};

router.get('/config', requireAuth, requireRole(...staffRoles), asyncRoute(async (_req, res) => {
  const { config, providerConfigured } = await readConfig();
  res.json({ config, providerConfigured });
}));

router.patch('/config', requireAuth, requireRole(...staffRoles), asyncRoute(async (req, res) => {
  const input = configSchema.safeParse(req.body);
  if (!input.success) throw httpError(400, 'Invalid assistant configuration');
  const { entry } = await readConfig();
  const content = input.data as Prisma.InputJsonObject;
  const saved = entry
    ? await prisma.cmsEntry.update({ where: { id: entry.id }, data: { content, status: PublicationStatus.DRAFT, publishedAt: null, authorId: req.authUser!.id } })
    : await prisma.cmsEntry.create({ data: { type: 'ai-config', slug: 'assistant', title: 'Assistant configuration', content, status: PublicationStatus.DRAFT, authorId: req.authUser!.id } });
  await prisma.auditLog.create({ data: { actorId: req.authUser!.id, action: 'AI_CONFIG_UPDATE', entity: 'CmsEntry', entityId: saved.id } });
  res.json({ config: input.data, providerConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()) });
}));

router.post('/chat', chatLimiter, asyncRoute(async (req, res) => {
  const input = z.object({ message: z.string().trim().min(2).max(4000), language: z.enum(['en', 'so']).default('en') }).safeParse(req.body);
  if (!input.success) throw httpError(400, 'Enter a question for the SiHub assistant');
  const { config, providerConfigured } = await readConfig();
  if (providerConfigured) {
    try {
      const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const verifiedFaqs = config.knowledgeBase.map(item => `Question: ${item.question}\nAnswer: ${item.answer}`).join('\n\n');
      const response = await client.models.generateContent({
        model: config.model,
        contents: `Language: ${input.data.language === 'so' ? 'Somali' : 'English'}\nVerified SiHub FAQs:\n${verifiedFaqs || 'No verified FAQ entries are configured.'}\n\nVisitor question: ${input.data.message}`,
        config: { systemInstruction: config.systemPrompt, temperature: config.temperature }
      });
      const answer = response.text?.trim();
      if (answer) return res.json({ answer, mode: 'gemini' as const });
    } catch {
      throw httpError(503, 'The assistant provider is temporarily unavailable. Browse the public SiHub pages for current information.');
    }
  }

  const queryTerms = new Set(input.data.message.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(term => term.length > 2));
  const rankedFaqs = config.knowledgeBase.map(faq => {
    const haystack = `${faq.question} ${faq.answer}`.toLowerCase();
    return { faq, score: [...queryTerms].filter(term => haystack.includes(term)).length };
  }).sort((left, right) => right.score - left.score);
  const bestMatch = rankedFaqs[0];
  const answer = bestMatch && bestMatch.score > 0
    ? bestMatch.faq.answer
    : input.data.language === 'so'
      ? 'Kaaliyaha AI lama habeyn. Fadlan sahami bogagga SiHub ee dadweynaha si aad u hesho xogta hadda jirta.'
      : 'The AI provider is not configured and I could not find a matching verified FAQ. Please browse the public SiHub pages for current information.';
  res.json({ answer, mode: 'faq' as const });
}));

export default router;
