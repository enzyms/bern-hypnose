import { getCollection } from 'astro:content';

export const SITE_URL = 'https://bern-hypnose.ch';

export type SiteDocument = {
    /** Pathname with leading and trailing slash, e.g. /hypnosetherapie/stress/ */
    path: string;
    url: string;
    title: string;
    description: string;
    /** Raw markdown body, MDX already stripped of imports/JSX */
    body: string;
    collection: 'blog' | 'pages' | 'faq' | 'static';
    updated?: Date;
};

/** Routes not backed by a content collection (excludes noindex/admin/thank-you pages). */
export const STATIC_ROUTES: { path: string; title: string; description: string }[] = [
    { path: '/', title: 'Hypnosetherapie in Bern – Janine Aerni', description: 'Praxis für Hypnosetherapie im Zentrum von Bern. Diplomierte Hypnosetherapeutin VSH.' },
    { path: '/was-ist-hypnose/', title: 'Was ist Hypnose? Häufige Fragen', description: 'Antworten auf die häufigsten Fragen zu Hypnose und Hypnosetherapie.' },
    { path: '/klientinnenstimmen/', title: 'Klientinnenstimmen', description: 'Erfahrungsberichte und Google-Bewertungen von Klientinnen und Klienten.' },
    { path: '/termin/', title: 'Termin buchen', description: 'Online einen Termin für eine Hypnosetherapie-Sitzung in Bern buchen.' },
    { path: '/gutschein/', title: 'Gutschein', description: 'Geschenkgutschein für eine Hypnosetherapie-Sitzung.' },
    { path: '/newsletter/', title: 'Newsletter', description: 'Newsletter von Bern Hypnose abonnieren.' },
    { path: '/blog/', title: 'Blog', description: 'Blogartikel über Hypnose, Selbsthypnose und mentale Gesundheit.' },
    { path: '/app/start/', title: 'Geführte Kurzhypnose App', description: 'Kostenlose Selbsthypnose-Web-App von Bern Hypnose.' }
];

/**
 * Reduce an MDX body to plain markdown an LLM can digest:
 * drop imports/exports, keep link targets, drop JSX/HTML markup.
 */
function stripMdx(body: string): string {
    return body
        .replace(/^(import|export)\s[^\n]*\n/gm, '')
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
        .replace(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, '[$2]($1)')
        .replace(/<[^>]+>/g, '')
        .replace(/\{[^}]*\}/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

let documentsPromise: Promise<SiteDocument[]> | null = null;

export function getSiteDocuments(): Promise<SiteDocument[]> {
    documentsPromise ??= buildSiteDocuments();
    return documentsPromise;
}

async function buildSiteDocuments(): Promise<SiteDocument[]> {
    const [blog, pages, faq] = await Promise.all([getCollection('blog'), getCollection('pages'), getCollection('faq')]);

    const docs: SiteDocument[] = [];

    for (const route of STATIC_ROUTES) {
        docs.push({
            path: route.path,
            url: `${SITE_URL}${route.path}`,
            title: route.title,
            description: route.description,
            body: '',
            collection: 'static'
        });
    }

    for (const entry of pages) {
        const path = `/${entry.id}/`;
        docs.push({
            path,
            url: `${SITE_URL}${path}`,
            title: entry.data.title,
            description: entry.data.description ?? '',
            body: stripMdx(entry.body ?? ''),
            collection: 'pages'
        });
    }

    for (const entry of faq) {
        const path = `/was-ist-hypnose/${entry.id}/`;
        docs.push({
            path,
            url: `${SITE_URL}${path}`,
            title: entry.data.title,
            description: entry.data.description ?? entry.data.teaser ?? '',
            body: stripMdx(entry.body ?? ''),
            collection: 'faq',
            updated: entry.data.updatedDate
        });
    }

    const sortedBlog = [...blog].sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime());
    for (const entry of sortedBlog) {
        const path = `/blog/${entry.id}/`;
        docs.push({
            path,
            url: `${SITE_URL}${path}`,
            title: entry.data.title,
            description: entry.data.excerpt ?? '',
            body: stripMdx(entry.body ?? ''),
            collection: 'blog',
            updated: entry.data.updatedDate ?? entry.data.publishDate
        });
    }

    return docs;
}

/** All valid canonical pathnames on the site — used as the chatbot link whitelist. */
export async function getSitePaths(): Promise<string[]> {
    const docs = await getSiteDocuments();
    const paths = new Set(docs.map((doc) => doc.path));
    paths.add('/tags/');
    paths.add('/kontakt/');
    const blog = await getCollection('blog');
    const tagNames = new Set(blog.flatMap((post) => post.data.tags ?? []));
    const { slugify } = await import('./common-utils');
    for (const tag of tagNames) {
        paths.add(`/tags/${slugify(tag)}/`);
    }
    return [...paths].sort();
}
