import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const backlinkSchema = z.object({
  title: z.string().optional(),
  url: z.string().optional(),
});

const faq = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/faq' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string().optional(),
    publishDate: z.coerce.date().optional(),
    updatedDate: z.coerce.date().optional(),
    promoted: z.boolean().default(false),
    order: z.number(),
    teaser: z.string().optional(),
    linkText: z.string().optional(),
    // New fields for homepage FAQs
    category: z.enum(['general', 'practical', 'homepage']).default('general'),
    showOnHomepage: z.boolean().default(false),
    showOnPages: z.array(z.string()).optional(),
    shortAnswer: z.string().optional(), // Brief answer for homepage display
    linkTo: z.string().optional(), // Custom link destination
    image: z.object({
      src: image().optional(),
      alt: z.string().optional(),
    }).optional(),
  })
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    excerpt: z.string().optional(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    isFeatured: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    image: z.object({
      src: image().optional(),
      alt: z.string().optional(),
    }).optional(),
    canonical: z.string().optional(),
  })
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    seoTitle: z.string().optional(),
    description: z.string().optional(),
    backlink: backlinkSchema.optional(),
    image: z.object({
      src: image().optional(),
      alt: z.string().optional(),
    }).optional(),
    canonical: z.string().optional(),
    schema: z.string().optional(),
    reviewDate: z.string().optional(),
  })
});

const tags = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tags' }),
  schema: z.object({
    title: z.string(),
    canonical: z.string().optional(),
  })
});

// Weekly audio messages by Janine. Audio lives in R2 (never in git), served by
// workers/podcast-audio and proxied by Netlify at /podcast-audio/.
const PODCAST_AUDIO_BASE = 'https://bern-hypnose.ch/podcast-audio/';

const podcast = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/podcast' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    publishDate: z.coerce.date(),
    summary: z.string(), // meta description + list teaser
    audioUrl: z.string().url().startsWith(PODCAST_AUDIO_BASE, {
      message: `audioUrl must start with ${PODCAST_AUDIO_BASE}`,
    }),
    duration: z.number().int().positive(), // seconds
    fileSize: z.number().int().positive(), // bytes
    episode: z.number().int().min(1),
    draft: z.boolean().default(false),
    image: z.object({
      src: image().optional(),
      alt: z.string().optional(),
    }).optional(),
  })
});

export const collections = { blog, pages, faq, tags, podcast };
