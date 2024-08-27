import { defineCollection, z } from 'astro:content';

const seoSchema = z.object({
    image: z
        .object({
            src: z.string().optional(),  
            alt: z.string().optional()   
        })
        .optional(),                    
});

const backlinkSchema = z.object({
    title: z.string().optional(),  
    url: z.string().optional()                 
});

const blog = defineCollection({
    schema: z.object({
        title: z.string(),
        excerpt: z.string().optional(),
        publishDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        isFeatured: z.boolean().default(false),
        tags: z.array(z.string()).default([]),
        seo: seoSchema.optional(),
    })
});

const pages = defineCollection({
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        seo: seoSchema.optional(),
        backlink: backlinkSchema.optional(),
    })
});

export const collections = { blog, pages };
