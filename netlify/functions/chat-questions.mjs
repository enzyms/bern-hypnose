/**
 * Private live view of chatbot conversations at /chat-questions.
 *
 * Visitor questions must never enter the (public) git repo, so nothing is
 * stored here: this function fetches conversations from the AnythingLLM API
 * on every request and renders them, gated by HTTP Basic-Auth.
 *
 * Shows full Q&A per session (answers collapsible) plus the metadata useful
 * for improving answers: linked paths, sources count, timing.
 *
 * Required Netlify environment variables:
 *   ANYTHINGLLM_API_KEY       — AnythingLLM: Settings → Developer API
 *   CHAT_QUESTIONS_PASSWORD   — password for the page (user: admin)
 *   ANYTHINGLLM_BASE_URL      — optional, default https://chat.bern-hypnose.ch
 */

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const ANSWER_TOGGLE_THRESHOLD = 260;

function parseAnswer(response) {
    if (typeof response !== 'string') return { text: '', sourceCount: 0 };
    try {
        const parsed = JSON.parse(response);
        return {
            text: typeof parsed.text === 'string' ? parsed.text : String(response),
            sourceCount: Array.isArray(parsed.sources) ? parsed.sources.length : 0
        };
    } catch {
        return { text: response, sourceCount: 0 };
    }
}

/** Highlight site paths in an answer so invented links stand out visually. */
function renderAnswerText(text) {
    return esc(text).replace(/\/[a-zäöüß0-9-]+(?:\/[a-zäöüß0-9-]+)+\/?/gi, (m) => `<span class="path">${m}</span>`);
}

function renderAnswer(text, sourceCount) {
    const meta = sourceCount > 0 ? `<span class="meta">📎 ${sourceCount} Quellen</span>` : '<span class="meta warn">📎 keine Quellen (Retrieval leer!)</span>';
    if (text.length <= ANSWER_TOGGLE_THRESHOLD) {
        return `<div class="answer">${renderAnswerText(text)} ${meta}</div>`;
    }
    const preview = esc(text.slice(0, 160).replace(/\s+\S*$/, ''));
    return `<details class="answer"><summary>${preview}… ${meta}</summary><div class="full">${renderAnswerText(text)}</div></details>`;
}

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

    // Parse into entries, keep chronological order within a session
    const entries = chats
        .filter((c) => (c.prompt ?? '').trim())
        .map((c) => {
            const ts = c.createdAt ?? c.created_at;
            const date = new Date(typeof ts === 'number' && ts < 1e12 ? ts * 1000 : ts);
            const { text, sourceCount } = parseAnswer(c.response);
            return {
                id: c.id,
                date: isNaN(date) ? null : date,
                session: (c.session_id ?? c.sessionId ?? '?').slice(0, 8),
                question: c.prompt.trim(),
                answer: text.trim(),
                sourceCount
            };
        })
        .sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0) || a.id - b.id);

    // Group: month (newest first) → session (newest first) → messages (chronological)
    const byMonth = new Map();
    for (const entry of entries) {
        const month = entry.date ? entry.date.toISOString().slice(0, 7) : 'unbekannt';
        if (!byMonth.has(month)) byMonth.set(month, new Map());
        const sessions = byMonth.get(month);
        if (!sessions.has(entry.session)) sessions.set(entry.session, []);
        sessions.get(entry.session).push(entry);
    }

    const months = [...byMonth.entries()].sort((a, b) => b[0].localeCompare(a[0]));

    const sections = months
        .map(([month, sessions]) => {
            const sessionBlocks = [...sessions.entries()]
                .sort((a, b) => (b[1].at(-1).date?.getTime() ?? 0) - (a[1].at(-1).date?.getTime() ?? 0))
                .map(([session, messages]) => {
                    const first = messages[0].date;
                    const dateLabel = first ? `${first.toISOString().slice(0, 10)} ${first.toISOString().slice(11, 16)} UTC` : '–';
                    const rows = messages
                        .map(
                            (m) => `
                <div class="qa">
                    <div class="q">${esc(m.question)}</div>
                    ${renderAnswer(m.answer, m.sourceCount)}
                </div>`
                        )
                        .join('');
                    return `
            <div class="session">
                <div class="session-head"><span class="sid">${esc(session)}</span> · ${esc(dateLabel)} · ${messages.length} ${messages.length === 1 ? 'Frage' : 'Fragen'}</div>
                ${rows}
            </div>`;
                })
                .join('');
            const total = [...sessions.values()].reduce((sum, arr) => sum + arr.length, 0);
            return `<h2>${esc(month)} <small>(${total} Fragen, ${sessions.size} Sessions)</small></h2>${sessionBlocks}`;
        })
        .join('\n');

    const html = `<!doctype html>
<html lang="de"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Chatbot-Konversationen – intern</title>
<style>
    body{font-family:system-ui,sans-serif;max-width:860px;margin:2rem auto;padding:0 1rem;color:#222;line-height:1.5}
    h1{font-size:1.4rem} h2{margin-top:2.2rem;border-bottom:1px solid #ddd;padding-bottom:.3rem}
    small{color:#888;font-weight:normal}
    .hint{background:#f7f0f8;border:1px solid #ead7eb;border-radius:10px;padding:.7rem 1rem;font-size:.85rem;color:#555}
    .session{border:1px solid #e8e8e8;border-radius:12px;padding:.8rem 1rem;margin:1rem 0}
    .session-head{font-size:.78rem;color:#888;margin-bottom:.5rem}
    .sid{font-family:monospace;color:#b06ec7}
    .qa{border-top:1px solid #f0f0f0;padding:.6rem 0}
    .qa:first-of-type{border-top:none}
    .q{font-weight:700;margin-bottom:.25rem}
    .q::before{content:"👤 "}
    .answer{font-size:.92rem;color:#444;white-space:pre-wrap}
    .answer summary{cursor:pointer;color:#444;white-space:normal}
    .answer summary:hover{color:#000}
    .answer .full{margin-top:.4rem}
    .path{font-family:monospace;font-size:.85em;background:#f3e8f4;color:#7a3d8f;border-radius:4px;padding:0 4px}
    .meta{font-size:.75rem;color:#888;white-space:nowrap}
    .meta.warn{color:#b45309}
</style></head><body>
<h1>Chatbot-Konversationen <small>${entries.length} Nachrichten · live aus AnythingLLM</small></h1>
<p class="hint">
    Verlinkte Pfade sind <span class="path">markiert</span> — prüfe stichprobenartig, ob sie existieren.
    «keine Quellen» heisst: das Retrieval fand nichts — solche Antworten kommen aus dem Modellgedächtnis und sind fehleranfällig.
    Qualitäts-Check: <code>node scripts/test-chatbot.js</code> · Trends: <a href="/dashboard/">/dashboard/</a>
</p>
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
