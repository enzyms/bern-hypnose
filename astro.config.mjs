import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import svelte from '@astrojs/svelte';
import worker from '@astropub/worker';
import AstroPWA from '@vite-pwa/astro'

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
        worker(),
        AstroPWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'My PWA Subpage',
                short_name: 'PWA Subpage',
                start_url: '/app/start/', 
                scope: '/app/start/',
                display: 'standalone',
                background_color: '#ffffff',
                theme_color: '#000000',
                icons: [
                  {
                    src: '/pwa-icon-192.png',
                    sizes: '192x192',
                    type: 'image/png',
                  },
                  {
                    src: '/pwa-icon-512.png',
                    sizes: '512x512',
                    type: 'image/png',
                  },
                ],
              },
        })
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
