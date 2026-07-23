import type { APIRoute } from 'astro';
import { getSiteDocuments } from '../utils/site-content';

export const GET: APIRoute = async () => {
    const docs = await getSiteDocuments();

    const line = (doc: { title: string; url: string; description: string }) =>
        `- [${doc.title}](${doc.url})${doc.description ? `: ${doc.description}` : ''}`;

    const servicePages = docs.filter((d) => d.collection === 'pages' && d.path.startsWith('/hypnosetherapie/'));
    const otherPages = docs.filter((d) => d.collection === 'pages' && !d.path.startsWith('/hypnosetherapie/'));
    const staticPages = docs.filter((d) => d.collection === 'static');
    const faqs = docs.filter((d) => d.collection === 'faq');
    const blog = docs.filter((d) => d.collection === 'blog');

    const content = [
        '# Bern Hypnose – Janine Aerni',
        '',
        '> Praxis für Hypnosetherapie im Zentrum von Bern (Schweiz). Janine Aerni ist diplomierte Hypnosetherapeutin VSH und begleitet Menschen bei Ängsten, Stress, Burnout, Schlafstörungen, Rauchstopp, Gewichtsthemen und weiteren Anliegen. Alle Inhalte sind auf Deutsch.',
        '',
        'Jede Inhaltsseite ist zusätzlich als Markdown abrufbar: Trailing-Slash der URL durch `.md` ersetzen (z.B. https://bern-hypnose.ch/hypnosetherapie/stress.md). Der komplette Website-Inhalt in einer Datei: https://bern-hypnose.ch/llms-full.txt',
        '',
        '## Praxis & Angebote',
        '',
        ...staticPages.map(line),
        ...otherPages.map(line),
        '',
        '## Hypnosetherapie – Anwendungsgebiete',
        '',
        ...servicePages.map(line),
        '',
        '## Häufige Fragen (FAQ)',
        '',
        ...faqs.map(line),
        '',
        '## Blog',
        '',
        ...blog.map(line),
        ''
    ].join('\n');

    return new Response(content, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
};
