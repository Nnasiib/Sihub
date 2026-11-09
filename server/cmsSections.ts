import { z } from 'zod';

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const safeUrl = z.string().trim().min(1).max(2048).refine(value => {
  if (/^\/api\/media\/[A-Za-z0-9_-]+\/public$/.test(value)) return true;
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
}, 'Links and media must use a safe relative path or HTTPS URL.');
const base = { id: z.string().trim().min(1).max(100) };
const alignment = z.enum(['left', 'center', 'right']).optional();
const font = z.enum(['sans', 'serif', 'mono']).optional();
const fontSize = z.enum(['sm', 'base', 'lg', 'xl', '2xl', '3xl']).optional();
const ratio = z.enum(['auto', '1/1', '4/3', '16/9', '9/16']).optional();
const blockSchema = z.union([
  z.object({ ...base, type: z.literal('heading'), text: z.string().max(2000), level: z.union([z.literal(2), z.literal(3), z.literal(4)]), alignment, color: color.optional(), fontFamily: font, fontSize }),
  z.object({ ...base, type: z.literal('subheading'), text: z.string().max(2000), alignment, color: color.optional(), fontFamily: font, fontSize }),
  z.object({ ...base, type: z.literal('paragraph'), text: z.string().max(20000), alignment, color: color.optional(), fontFamily: font, fontSize }),
  z.object({ ...base, type: z.literal('richText'), text: z.string().max(20000), alignment, color: color.optional(), fontFamily: font, fontSize }),
  z.object({ ...base, type: z.literal('list'), items: z.array(z.string().max(2000)).max(100), alignment, color: color.optional(), fontFamily: font, fontSize }),
  z.object({ ...base, type: z.literal('quote'), text: z.string().max(20000), author: z.string().max(300).optional(), title: z.string().max(300).optional(), alignment, color: color.optional() }),
  z.object({ ...base, type: z.literal('link'), label: z.string().trim().min(1).max(300), url: safeUrl, alignment }),
  z.object({ ...base, type: z.literal('button'), label: z.string().trim().min(1).max(300), url: safeUrl, alignment, variant: z.enum(['primary', 'secondary', 'outline']).optional() }),
  z.object({ ...base, type: z.literal('image'), src: safeUrl, alt: z.string().max(500), caption: z.string().max(1000).optional(), aspectRatio: ratio, alignment, position: alignment }),
  z.object({ ...base, type: z.literal('video'), src: safeUrl, alt: z.string().max(500), caption: z.string().max(1000).optional(), aspectRatio: ratio, alignment, position: alignment }),
  z.object({ ...base, type: z.literal('gallery'), items: z.array(z.object({ src: safeUrl, alt: z.string().max(500), caption: z.string().max(1000).optional() })).max(40), aspectRatio: ratio }),
  z.object({ ...base, type: z.literal('videoGallery'), items: z.array(z.object({ src: safeUrl, alt: z.string().max(500), caption: z.string().max(1000).optional() })).max(40), aspectRatio: ratio }),
  z.object({ ...base, type: z.literal('card'), title: z.string().max(500), description: z.string().max(5000), icon: z.string().max(100).optional(), url: safeUrl.optional(), buttonLabel: z.string().max(100).optional(), badge: z.string().max(100).optional(), image: safeUrl.optional() }),
  z.object({ ...base, type: z.literal('stat'), value: z.string().max(100), label: z.string().max(300), description: z.string().max(1000).optional(), icon: z.string().max(100).optional(), change: z.string().max(100).optional() }),
  z.object({ ...base, type: z.literal('teamMember'), name: z.string().max(200), role: z.string().max(200), bio: z.string().max(3000).optional(), image: safeUrl.optional(), location: z.string().max(200).optional() }),
  z.object({ ...base, type: z.literal('testimonial'), quote: z.string().max(5000), author: z.string().max(200), organization: z.string().max(200).optional(), role: z.string().max(200).optional(), avatar: safeUrl.optional(), rating: z.number().int().min(1).max(5).optional() }),
  z.object({ ...base, type: z.literal('partnerLogo'), name: z.string().max(200), logoUrl: safeUrl, websiteUrl: safeUrl.optional(), tier: z.string().max(100).optional() }),
  z.object({ ...base, type: z.literal('programCard'), title: z.string().max(300), category: z.string().max(200).optional(), description: z.string().max(5000), duration: z.string().max(100).optional(), targetAudience: z.string().max(300).optional(), image: safeUrl.optional(), actionUrl: safeUrl.optional() }),
  z.object({ ...base, type: z.literal('embed'), src: safeUrl, title: z.string().max(300).optional(), aspectRatio: ratio }),
  z.object({ ...base, type: z.literal('document'), title: z.string().max(300), description: z.string().max(1000).optional(), fileUrl: safeUrl, fileSize: z.string().max(100).optional(), format: z.string().max(50).optional() }),
  z.object({ ...base, type: z.literal('textImage'), heading: z.string().max(500).optional(), text: z.string().max(20000), image: safeUrl, imageAlt: z.string().max(500).optional(), caption: z.string().max(1000).optional(), layout: z.enum(['imageLeft', 'imageRight']).optional() }),
  z.object({ ...base, type: z.literal('divider'), style: z.enum(['solid', 'dashed', 'dotted', 'space']).optional(), height: z.enum(['sm', 'md', 'lg']).optional() }),
  z.object({ ...base, type: z.literal('contactInfo'), title: z.string().max(300), email: z.string().max(200).optional(), phone: z.string().max(100).optional(), address: z.string().max(500).optional(), hours: z.string().max(200).optional() }),
  z.object({ ...base, type: z.literal('faq'), items: z.array(z.object({ question: z.string().trim().min(1).max(1000), answer: z.string().trim().min(1).max(10000) })).max(80) }),
  z.object({ ...base, type: z.literal('timeline'), items: z.array(z.object({ date: z.string().max(100), title: z.string().trim().min(1).max(500), description: z.string().max(5000).optional() })).max(100), orientation: z.enum(['vertical', 'horizontal']).optional() }),
  z.object({ ...base, type: z.literal('eventCard'), title: z.string().trim().min(1).max(500), description: z.string().max(5000).optional(), date: z.string().max(100).optional(), time: z.string().max(100).optional(), venue: z.string().max(500).optional(), image: safeUrl.optional(), imageAlt: z.string().max(500).optional(), url: safeUrl.optional() }),
  z.object({ ...base, type: z.literal('newsCard'), title: z.string().trim().min(1).max(500), summary: z.string().max(5000).optional(), publishedAt: z.string().max(100).optional(), category: z.string().max(200).optional(), image: safeUrl.optional(), imageAlt: z.string().max(500).optional(), url: safeUrl.optional() }),
  z.object({ ...base, type: z.literal('customHtml'), html: z.string().max(50000) })
]);

const sectionSchema = z.object({
  id: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(180),
  description: z.string().max(2000).optional(),
  placement: z.enum(['top', 'bottom']),
  order: z.number().int().min(0),
  visible: z.boolean(),
  archived: z.boolean(),
  layout: z.object({
    desktopColumns: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    tabletColumns: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    mobileColumns: z.union([z.literal(1), z.literal(2)]),
    backgroundColor: color,
    textColor: color,
    spacing: z.enum(['compact', 'normal', 'spacious']),
    contentWidth: z.enum(['contained', 'wide', 'full']).optional(),
    borderStyle: z.enum(['none', 'solid', 'dashed']).optional()
  }),
  blocks: z.array(blockSchema).max(100)
});

export const validateDynamicPageSections = (content: unknown): string | null => {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return null;
  const sections = (content as Record<string, unknown>).sections;
  if (sections === undefined) return null;
  const parsed = z.array(sectionSchema).safeParse(sections);
  return parsed.success ? null : 'Page sections contain invalid fields, layout values, or media URLs.';
};
