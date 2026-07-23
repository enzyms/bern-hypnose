import type { APIRoute } from 'astro';
import { getSiteDocuments } from '../utils/site-content';

// Lightweight index for the homepage search (title/description matching,
// consumed by SearchSection.svelte). ~30 KB.
export const GET: APIRoute = async () => {
    const docs = await getSiteDocuments();
    const index = docs
        .filter((doc) => doc.title)
        .map((doc) => ({ path: doc.path, title: doc.title, description: doc.description, collection: doc.collection }));
    return new Response(JSON.stringify(index), {
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
};
