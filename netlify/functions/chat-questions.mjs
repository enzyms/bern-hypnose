/**
 * Private live view of chatbot questions at /chat-questions.
 *
 * Visitor questions must never enter the (public) git repo, so nothing is
 * stored here: this function fetches conversations from the AnythingLLM API
 * on every request and renders them, gated by HTTP Basic-Auth.
 *
 * Required Netlify environment variables:
 *   ANYTHINGLLM_API_KEY       — AnythingLLM: Settings → Developer API
 *   CHAT_QUESTIONS_PASSWORD   — password for the page (user: admin)
 *   ANYTHINGLLM_BASE_URL      — optional, default https://chat.bern-hypnose.ch
 */

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export default async (req) => {
    const password = process.env.CHAT_QUESTIONS_PASSWORD;
    if (!password || !process.env.ANYTHINGLLM_API_KEY) {
        return new Response('Not configured: set CHAT_QUESTIONS_PASSWORD and ANYTHINGLLM_API_KEY in Netlify env.', { status: 503 });
    }

    const expected = 'Basic ' + Buffer.from(`admin:${password}`).toString('base64');
    if (req.headers.get('authorization') !== expected) {
        return new Response('Authentifizierung erforderlich.', {
            status: 401,
            headers: { 'WWW-Authenticate': 'Basic realm="Chat-Fragen"', 'X-Robots-Tag': 'noindex' }
        });
    }

    const base = (process.env.ANYTHINGLLM_BASE_URL ?? 'https://chat.bern-hypnose.ch').replace(/\/$/, '');
    const api = async (path) => {
        const res = await fetch(`${base}/api/v1${path}`, {
            headers: { Authorization: `Bearer ${process.env.ANYTHINGLLM_API_KEY}`, accept: 'application/json' }
        });
        if (!res.ok) throw new Error(`AnythingLLM ${res.status} on ${path}`);
        return res.json();
    };

    let chats = [];
    try {
        const { embeds = [] } = await api('/embed');
        for (const embed of embeds) {
            const uuid = embed.uuid ?? embed.id;
            const data = await api(`/embed/${uuid}/chats`);
            chats = chats.concat(data.chats ?? []);
        }
    } catch (err) {
        return new Response(`Fehler beim Laden: ${esc(err.message)}`, { status: 502 });
    }

    // newest first, grouped by month
    const entries = chats
        .filter((c) => (c.prompt ?? '').trim())
        .map((c) => {
            const ts = c.createdAt ?? c.created_at;
            const date = new Date(typeof ts === 'number' && ts < 1e12 ? ts * 1000 : ts);
            return {
                date: isNaN(date) ? null : date,
                session: (c.session_id ?? c.sessionId ?? '?').slice(0, 8),
                question: c.prompt.trim()
            };
        })
        .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));

    const byMonth = new Map();
    for (const e of entries) {
        const month = e.date ? e.date.toISOString().slice(0, 7) : 'unbekannt';
        if (!byMonth.has(month)) byMonth.set(month, []);
        byMonth.get(month).push(e);
    }

    const sections = [...byMonth.entries()]
        .map(
            ([month, list]) => `
        <h2>${esc(month)} <small>(${list.length})</small></h2>
        <table>
            ${list
                .map(
                    (e) => `<tr>
                <td class="d">${e.date ? esc(e.date.toISOString().slice(0, 10)) : '–'}</td>
                <td class="s">${esc(e.session)}</td>
                <td>${esc(e.question)}</td>
            </tr>`
                )
                .join('')}
        </table>`
        )
        .join('\n');

    const html = `<!doctype html>
<html lang="de"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Chatbot-Fragen – intern</title>
<style>
    body{font-family:system-ui,sans-serif;max-width:820px;margin:2rem auto;padding:0 1rem;color:#222}
    h1{font-size:1.4rem} h2{margin-top:2rem;border-bottom:1px solid #ddd;padding-bottom:.3rem}
    table{width:100%;border-collapse:collapse;font-size:.92rem}
    td{padding:.35rem .5rem;vertical-align:top;border-bottom:1px solid #f0f0f0}
    .d{white-space:nowrap;color:#888;width:6.5rem}
    .s{font-family:monospace;color:#b06ec7;width:6rem}
    small{color:#888;font-weight:normal}
</style></head><body>
<h1>Chatbot-Fragen <small>${entries.length} gesamt · live aus AnythingLLM</small></h1>
${sections}
</body></html>`;

    return new Response(html, {
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'X-Robots-Tag': 'noindex, nofollow',
            'Cache-Control': 'no-store'
        }
    });
};

export const config = { path: '/chat-questions' };
