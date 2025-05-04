import { defineCollection, z } from 'astro:content';

const seoSchema = z.object({
  image: z.object({
    src: z.string(), 
  }).optional(),
  alt: z.string().optional(),
});

const backlinkSchema = z.object({
  title: z.string().optional(),
  url: z.string().optional(),
});

const faq = defineCollection({
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string().optional(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    promoted: z.boolean().default(false),
    image: z.object({
      src: image().optional(),
      alt: z.string().optional(),
    }).optional(),
  })
});

const blog = defineCollection({
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
  schema: ({ image }) => z.object({
    title: z.string(),
    seoTitle: z.string().optional(),
    description: z.string().optional(),
    backlink: backlinkSchema.optional(),
    image: z.object({
      src: image().optional(),
      alt: z.string().optional(),
    }).optional(),
    id: z.string().optional(),
    canonical: z.string().optional(),
  })
});


export const collections = { blog, pages };
