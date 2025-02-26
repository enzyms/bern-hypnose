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
                name: 'Bern Hypnose Web App',
                short_name: 'Bern Hypnose',
                description: 'Selbsthypnose App von Bern Hypnose',
                start_url: '/app/',
                scope: '/app/',
                display: 'standalone',
                background_color: '#ffffff',
                theme_color: '#000000',
                orientation: 'portrait',
                categories: ['health', 'lifestyle'],
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
                    {
                        src: '/pwa-icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ],
            },
            devOptions: {
                enabled: true,
                type: 'module',
            },
            includeAssets: ['favicon.svg', 'pwa-icon-192.png', 'pwa-icon-512.png'],
            // workbox: {
            //     globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
            //     navigateFallback: null,
            //     maximumFileSizeToCacheInBytes: 8 * 1024 * 1024, // 8MB
            //     runtimeCaching: [
            //         {
            //             urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
            //             handler: 'CacheFirst',
            //             options: {
            //                 cacheName: 'images',
            //                 expiration: {
            //                     maxEntries: 50,
            //                     maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
            //                 }
            //             }
            //         }
            //     ]
            // }
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
