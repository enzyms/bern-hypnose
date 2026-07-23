import type { APIRoute } from 'astro';
import { getSiteDocuments } from '../utils/site-content';

export const GET: APIRoute = async () => {
    const docs = (await getSiteDocuments()).filter((doc) => doc.body.trim().length > 0);

    const sections = docs.map((doc) =>
        [
            `# ${doc.title}`,
            '',
            `URL: ${doc.url}`,
            doc.description ? `Beschreibung: ${doc.description}` : null,
            doc.updated ? `Aktualisiert: ${doc.updated.toISOString().slice(0, 10)}` : null,
            '',
            doc.body
        ]
            .filter((part) => part !== null)
            .join('\n')
    );

    const header = [
        '# Bern Hypnose – Janine Aerni: Gesamter Website-Inhalt',
        '',
        '> Praxis für Hypnosetherapie in Bern. Dieses Dokument enthält den vollständigen Inhalt von https://bern-hypnose.ch als Markdown, eine Seite pro Abschnitt.',
        ''
    ].join('\n');

    return new Response(header + '\n' + sections.join('\n\n---\n\n') + '\n', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
};
