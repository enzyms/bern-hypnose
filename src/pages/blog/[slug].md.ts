import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_URL } from '../../utils/site-content';

export async function getStaticPaths() {
    const posts = await getCollection('blog');
    return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

export const GET: APIRoute = async ({ props }) => {
    const { post } = props;
    const content = [
        `# ${post.data.title}`,
        '',
        `Kanonische URL: ${SITE_URL}/blog/${post.id}/`,
        post.data.excerpt ? `Beschreibung: ${post.data.excerpt}` : null,
        `Publiziert: ${post.data.publishDate.toISOString().slice(0, 10)}`,
        post.data.updatedDate ? `Aktualisiert: ${post.data.updatedDate.toISOString().slice(0, 10)}` : null,
        'Autorin: Janine Aerni, dipl. Hypnosetherapeutin VSH, Bern',
        '',
        post.body ?? ''
    ]
        .filter((part) => part !== null)
        .join('\n');

    return new Response(content, {
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
    });
};
