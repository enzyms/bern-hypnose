import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import svelte from '@astrojs/svelte';
import worker from '@astropub/worker';

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
    ],
    image: {
        domains: ['localhost'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.storyblok.com'
            },
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '4321',
                pathname: '/*'
            }
        ],
        vite: {
            server: {
                https: true
            }
        }
    }
});
