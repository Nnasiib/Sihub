export type CmsSectionPlacement = 'top' | 'bottom';
export type CmsAlignment = 'left' | 'center' | 'right';
export type CmsFontSize = 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
export type CmsFontFamily = 'sans' | 'serif' | 'mono';
export type CmsAspectRatio = 'auto' | '1/1' | '4/3' | '16/9' | '9/16';
export type CmsBlockType =
  | 'heading'
  | 'subheading'
  | 'paragraph'
  | 'richText'
  | 'list'
  | 'quote'
  | 'link'
  | 'button'
  | 'image'
  | 'video'
  | 'gallery'
  | 'videoGallery'
  | 'card'
  | 'stat'
  | 'teamMember'
  | 'testimonial'
  | 'partnerLogo'
  | 'programCard'
  | 'embed'
  | 'document'
  | 'textImage'
  | 'divider'
  | 'contactInfo'
  | 'faq'
  | 'timeline'
  | 'eventCard'
  | 'newsCard'
  | 'customHtml';

interface CmsBlockBase {
  id: string;
  type: CmsBlockType;
}

export type CmsContentBlock =
  | (CmsBlockBase & { type: 'heading'; text: string; level: 2 | 3 | 4; alignment?: CmsAlignment; color?: string; fontFamily?: CmsFontFamily; fontSize?: CmsFontSize })
  | (CmsBlockBase & { type: 'subheading'; text: string; alignment?: CmsAlignment; color?: string; fontFamily?: CmsFontFamily; fontSize?: CmsFontSize })
  | (CmsBlockBase & { type: 'paragraph'; text: string; alignment?: CmsAlignment; color?: string; fontFamily?: CmsFontFamily; fontSize?: CmsFontSize })
  | (CmsBlockBase & { type: 'richText'; text: string; alignment?: CmsAlignment; color?: string; fontFamily?: CmsFontFamily; fontSize?: CmsFontSize })
  | (CmsBlockBase & { type: 'list'; items: string[]; alignment?: CmsAlignment; color?: string; fontFamily?: CmsFontFamily; fontSize?: CmsFontSize })
  | (CmsBlockBase & { type: 'quote'; text: string; author?: string; title?: string; alignment?: CmsAlignment; color?: string; fontFamily?: CmsFontFamily; fontSize?: CmsFontSize })
  | (CmsBlockBase & { type: 'link'; label: string; url: string; alignment?: CmsAlignment })
  | (CmsBlockBase & { type: 'button'; label: string; url: string; alignment?: CmsAlignment; variant?: 'primary' | 'secondary' | 'outline' })
  | (CmsBlockBase & { type: 'image'; src: string; alt: string; caption?: string; aspectRatio?: CmsAspectRatio; alignment?: CmsAlignment; position?: CmsAlignment })
  | (CmsBlockBase & { type: 'video'; src: string; alt: string; caption?: string; aspectRatio?: CmsAspectRatio; alignment?: CmsAlignment; position?: CmsAlignment })
  | (CmsBlockBase & { type: 'gallery'; items: { src: string; alt: string; caption?: string }[]; aspectRatio?: CmsAspectRatio })
  | (CmsBlockBase & { type: 'videoGallery'; items: { src: string; alt: string; caption?: string }[]; aspectRatio?: CmsAspectRatio })
  | (CmsBlockBase & { type: 'card'; title: string; description: string; icon?: string; url?: string; buttonLabel?: string; badge?: string; image?: string })
  | (CmsBlockBase & { type: 'stat'; value: string; label: string; description?: string; icon?: string; change?: string })
  | (CmsBlockBase & { type: 'teamMember'; name: string; role: string; bio?: string; image?: string; location?: string })
  | (CmsBlockBase & { type: 'testimonial'; quote: string; author: string; organization?: string; role?: string; avatar?: string; rating?: number })
  | (CmsBlockBase & { type: 'partnerLogo'; name: string; logoUrl: string; websiteUrl?: string; tier?: string })
  | (CmsBlockBase & { type: 'programCard'; title: string; category?: string; description: string; duration?: string; targetAudience?: string; image?: string; actionUrl?: string })
  | (CmsBlockBase & { type: 'embed'; src: string; title?: string; aspectRatio?: CmsAspectRatio })
  | (CmsBlockBase & { type: 'document'; title: string; description?: string; fileUrl: string; fileSize?: string; format?: string })
  | (CmsBlockBase & { type: 'textImage'; heading?: string; text: string; image: string; imageAlt?: string; caption?: string; layout?: 'imageLeft' | 'imageRight' })
  | (CmsBlockBase & { type: 'divider'; style?: 'solid' | 'dashed' | 'dotted' | 'space'; height?: 'sm' | 'md' | 'lg' })
  | (CmsBlockBase & { type: 'contactInfo'; title: string; email?: string; phone?: string; address?: string; hours?: string })
  | (CmsBlockBase & { type: 'faq'; items: { question: string; answer: string }[] })
  | (CmsBlockBase & { type: 'timeline'; items: { date: string; title: string; description?: string }[]; orientation?: 'vertical' | 'horizontal' })
  | (CmsBlockBase & { type: 'eventCard'; title: string; description?: string; date?: string; time?: string; venue?: string; image?: string; imageAlt?: string; url?: string })
  | (CmsBlockBase & { type: 'newsCard'; title: string; summary?: string; publishedAt?: string; category?: string; image?: string; imageAlt?: string; url?: string })
  | (CmsBlockBase & { type: 'customHtml'; html: string });

export interface CmsSectionLayout {
  desktopColumns: 1 | 2 | 3 | 4;
  tabletColumns: 1 | 2 | 3;
  mobileColumns: 1 | 2;
  backgroundColor: string;
  textColor: string;
  spacing: 'compact' | 'normal' | 'spacious';
  contentWidth?: 'contained' | 'wide' | 'full';
  borderStyle?: 'none' | 'solid' | 'dashed';
}

export interface CmsPageSection {
  id: string;
  name: string;
  description?: string;
  placement: CmsSectionPlacement;
  order: number;
  visible: boolean;
  archived: boolean;
  layout: CmsSectionLayout;
  blocks: CmsContentBlock[];
}
