import { defineCollection, z } from 'astro:content';

const seoSchema = ({ image }: { image: any }) => z.object({
  image: image().refine((img: { width: number; }) => img.width >= 900, {
    message: "Cover image must be at least 1080 pixels wide!",
  }).optional(),
  alt: z.string().optional(),
});

const backlinkSchema = z.object({
  title: z.string().optional(),
  url: z.string().optional(),
});

const blog = defineCollection({
  schema: ({ image }) => z.object({
    title: z.string(),
    excerpt: z.string().optional(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    isFeatured: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    seo: seoSchema({ image }).optional(),
  })
});

const pages = defineCollection({
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string().optional(),
    seo: seoSchema({ image }).optional(),
    backlink: backlinkSchema.optional(),
  })
});

export const collections = { blog, pages };
