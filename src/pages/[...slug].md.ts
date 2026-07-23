import type { APIRoute } from 'astro';
import { getSiteDocuments, type SiteDocument } from '../utils/site-content';

// Markdown mirrors for the pages and faq collections (blog has its own route).
export async function getStaticPaths() {
    const docs = await getSiteDocuments();
    return docs
        .filter((doc) => (doc.collection === 'pages' || doc.collection === 'faq') && doc.body.trim().length > 0)
        .map((doc) => ({ params: { slug: doc.path.replace(/^\/|\/$/g, '') }, props: { doc } }));
}

export const GET: APIRoute = async ({ props }) => {
    const doc: SiteDocument = props.doc;
    const content = [
        `# ${doc.title}`,
        '',
        `Kanonische URL: ${doc.url}`,
        doc.description ? `Beschreibung: ${doc.description}` : null,
        'Autorin: Janine Aerni, dipl. Hypnosetherapeutin VSH, Bern',
        '',
        doc.body
    ]
        .filter((part) => part !== null)
        .join('\n');

    return new Response(content, {
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
    });
};
