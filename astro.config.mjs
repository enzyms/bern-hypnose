import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import worker from '@astropub/worker';

import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
    site: 'https://bern-hypnose.ch',
    trailingSlash: 'always',
    integrations: [
        mdx(),
        sitemap({
            filter: (page) => !page.includes('/admin/')
        }),
        tailwind({
            applyBaseStyles: false
        }),
        svelte(),
        worker()
    ]
});
