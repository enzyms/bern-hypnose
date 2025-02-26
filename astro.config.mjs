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
            mode: 'development',
            registerType: 'autoUpdate',
            manifest: {
                name: 'Bern Hypnose Web App',
                short_name: 'Bern Hypnose',
                description: 'Selbsthypnose App von Bern Hypnose',
                theme_color: '#000000',
                background_color: '#ffffff',
                display: 'standalone',
                orientation: 'portrait',
                start_url: '/app/',
                scope: '/app/',
                icons: [
                    {
                        src: 'icons/pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'icons/pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: 'icons/pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            },
            workbox: {
                maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
                globPatterns: ['**/*.{css,js,html,svg,png,ico,txt,mp3,wav}'],
                runtimeCaching: [{
                    urlPattern: /\.(mp3|wav)$/,
                    handler: 'CacheFirst',
                    options: {
                        cacheName: 'audio-cache',
                        expiration: {
                            maxEntries: 10,
                            maxAgeSeconds: 60 * 60 * 24 * 7,
                        },
                        rangeRequests: true,
                    },
                }],
            },
            devOptions: {
                enabled: true,
                type: 'module',
                navigateFallback: '/app/'
            }
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
