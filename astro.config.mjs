import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import svelte from '@astrojs/svelte';
import worker from '@astropub/worker';
import { AstroPWAIntegration } from '@vite-pwa/astro';

export default defineConfig({
    site: 'https://bern-hypnose.ch',
    trailingSlash: 'always',
    output: 'static',
    // Astro 7 defaults to 'jsx' (React-style whitespace stripping), which removes
    // visible spaces between inline elements. Keep the Astro 5/6 behaviour.
    compressHTML: true,
    integrations: [
        mdx(),
        sitemap({
            filter: (page) => {
                // Exclude admin pages
                if (page.includes('/admin/')) return false;

                // Exclude thank-you pages (noindex)
                if (page.includes('/gutschein-danke/')) return false;
                if (page.includes('/newsletter-danke/')) return false;

                // Exclude internal dashboard (noindex)
                if (page.includes('/dashboard/')) return false;

                // Janine's recording page (noindex)
                if (page.includes('/record/')) return false;

                // Now including pagination pages with self-referencing canonicals (SEO best practice)
                // Previously excluded, but canonicals handle duplicate content better than noindex

                return true;
            }
        }),
        svelte(),
        worker(),
        AstroPWAIntegration({
            mode: 'development',
            registerType: 'autoUpdate',
            maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
            manifest: {
                name: 'Bern Hypnose Web App',
                short_name: 'Bern Hypnose',
                description: 'Selbsthypnose App von Bern Hypnose',
                lang: 'de',
                theme_color: '#fee2e2',
                background_color: '#fee2e2',
                display: 'standalone',
                orientation: 'portrait',
                start_url: '/app/start/',
                scope: '/app/start/',
                icons: [
                    {
                        src: './icons/pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: './icons/pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            },
            generateSW: {
                globPatterns: ['**/*.{css,js,html,svg,png,ico,txt,mp3,wav}'],
                runtimeCaching: [
                    {
                        urlPattern: /\.(mp3|wav)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'audio-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 7
                            },
                            rangeRequests: true
                        }
                    }
                ]
            },
            devOptions: {
                enabled: true,
                type: 'module',
                navigateFallback: '/app/start/'
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
        ]
    }
});
