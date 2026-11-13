/**
 * Podcast audio Worker, bound to the private R2 bucket `bern-hypnose-podcast`.
 *
 * Read (public): GET/HEAD /<name>.mp3 → R2 `episodes/<name>.mp3`.
 *   Netlify proxies https://bern-hypnose.ch/podcast-audio/* here (200 rewrite in netlify.toml).
 *
 * Write (Janine's recorder at /record/): PUT /inbox/<UTC timestamp>.<ext>
 *   with `Authorization: Bearer <UPLOAD_TOKEN>` → R2 `inbox/…`. The 201 response carries the
 *   ntfy topic so the page can notify Sylvain. PUT /inbox/auth-check only validates the code.
 *   `inbox/` is never readable through this Worker.
 */

export interface Env {
    AUDIO: R2Bucket;
    UPLOAD_TOKEN?: string; // secret: wrangler secret put UPLOAD_TOKEN
    NTFY_TOPIC?: string; // secret: wrangler secret put NTFY_TOPIC (returned to authenticated uploaders)
}

const EPISODE_PREFIX = 'episodes/';
const EPISODE_NAME = /^[a-z0-9][a-z0-9-]*\.mp3$/;
const CACHE_CONTROL = 'public, max-age=86400';

const INBOX_PREFIX = 'inbox/';
const INBOX_NAME = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.(webm|ogg|m4a|mp4|mp3|wav|aac)$/;
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const MAX_NOTE_CHARS = 500;
const AUTH_CHECK = 'auth-check';

const ALLOWED_ORIGINS = [
    /^https:\/\/bern-hypnose\.ch$/,
    /^https:\/\/deploy-preview-\d+--bern-hypnose\.netlify\.app$/,
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/,
];

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        // Accept both "/<path>" (Netlify :splat) and "/podcast-audio/<path>".
        const path = new URL(request.url).pathname.replace(/^\/(podcast-audio\/)?/, '');

        if (path.startsWith(INBOX_PREFIX)) {
            return handleUpload(request, env, path.slice(INBOX_PREFIX.length));
        }
        return handleRead(request, env, path);
    },
} satisfies ExportedHandler<Env>;

// ---------------------------------------------------------------------------
// Read: published episodes
// ---------------------------------------------------------------------------

async function handleRead(request: Request, env: Env, name: string): Promise<Response> {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    if (!EPISODE_NAME.test(name)) {
        return new Response('Not Found', { status: 404 });
    }
    const key = EPISODE_PREFIX + name;

    if (request.method === 'HEAD') {
        const head = await env.AUDIO.head(key);
        if (!head) return new Response(null, { status: 404 });
        return new Response(null, { status: 200, headers: audioHeaders(head, head.size) });
    }

    let object: R2Object | R2ObjectBody | null;
    try {
        object = await env.AUDIO.get(key, { range: request.headers, onlyIf: request.headers });
    } catch {
        // R2 rejects unsatisfiable ranges.
        const head = await env.AUDIO.head(key);
        if (!head) return new Response('Not Found', { status: 404 });
        return rangeNotSatisfiable(head.size);
    }

    if (!object) return new Response('Not Found', { status: 404 });

    // Precondition (If-None-Match / If-Modified-Since) matched: no body returned.
    if (!('body' in object)) {
        return new Response(null, { status: 304, headers: audioHeaders(object) });
    }

    const rangeHeader = request.headers.get('range');
    const requestedStart = rangeHeader?.match(/^bytes=(\d+)-/)?.[1];
    if (requestedStart !== undefined && Number(requestedStart) >= object.size) {
        // Some R2 implementations ignore an out-of-bounds range instead of throwing.
        await object.body.cancel();
        return rangeNotSatisfiable(object.size);
    }

    const range = rangeHeader ? object.range : undefined;
    if (range) {
        const { start, end } = resolveRange(range, object.size);
        const headers = audioHeaders(object, end - start + 1);
        headers.set('Content-Range', `bytes ${start}-${end}/${object.size}`);
        return new Response(object.body, { status: 206, headers });
    }

    return new Response(object.body, { status: 200, headers: audioHeaders(object, object.size) });
}

function audioHeaders(object: R2Object, contentLength?: number): Headers {
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'audio/mpeg');
    headers.set('ETag', object.httpEtag);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', CACHE_CONTROL);
    if (contentLength !== undefined) headers.set('Content-Length', String(contentLength));
    return headers;
}

function rangeNotSatisfiable(size: number): Response {
    return new Response(null, {
        status: 416,
        headers: { 'Content-Range': `bytes */${size}`, 'Accept-Ranges': 'bytes' },
    });
}

function resolveRange(range: R2Range, size: number): { start: number; end: number } {
    if ('suffix' in range && range.suffix !== undefined) {
        return { start: Math.max(0, size - range.suffix), end: size - 1 };
    }
    const start = 'offset' in range && range.offset !== undefined ? range.offset : 0;
    const end = 'length' in range && range.length !== undefined ? Math.min(start + range.length, size) - 1 : size - 1;
    return { start, end };
}

// ---------------------------------------------------------------------------
// Write: raw recordings into the private inbox
// ---------------------------------------------------------------------------

async function handleUpload(request: Request, env: Env, name: string): Promise<Response> {
    const cors = corsHeaders(request.headers.get('Origin'));
    const reply = (status: number, body: Record<string, unknown> | null = null, extra: HeadersInit = {}) => {
        const headers = new Headers(cors);
        new Headers(extra).forEach((value, key) => headers.set(key, value));
        if (body) headers.set('Content-Type', 'application/json');
        return new Response(body ? JSON.stringify(body) : null, { status, headers });
    };

    // inbox/ is write-only: reading it looks exactly like a missing file.
    if (request.method === 'GET' || request.method === 'HEAD') return new Response('Not Found', { status: 404 });
    if (request.method === 'OPTIONS') return reply(204);
    if (request.method !== 'PUT') return reply(405, { error: 'method_not_allowed' }, { Allow: 'PUT, OPTIONS' });

    if (!env.UPLOAD_TOKEN) return reply(503, { error: 'upload_not_configured' });
    if (!(await isAuthorized(request.headers.get('Authorization'), env.UPLOAD_TOKEN))) {
        return reply(401, { error: 'unauthorized' });
    }

    // Lets the recorder validate the access code once, without uploading anything.
    if (name === AUTH_CHECK) return reply(204);

    if (!INBOX_NAME.test(name)) return reply(400, { error: 'invalid_name' });

    const contentType = (request.headers.get('Content-Type') ?? '').split(';')[0].trim().toLowerCase();
    if (!contentType.startsWith('audio/')) return reply(415, { error: 'not_audio' });

    const lengthHeader = request.headers.get('Content-Length');
    if (lengthHeader === null || !request.body) return reply(411, { error: 'length_required' });
    const length = Number(lengthHeader);
    if (!Number.isInteger(length) || length <= 0) return reply(400, { error: 'invalid_length' });
    if (length > MAX_UPLOAD_BYTES) return reply(413, { error: 'too_large', maxBytes: MAX_UPLOAD_BYTES });

    const key = INBOX_PREFIX + name;
    if (await env.AUDIO.head(key)) return reply(409, { error: 'exists', key });

    const note = safeDecode(request.headers.get('X-Podcast-Note') ?? '').slice(0, MAX_NOTE_CHARS);
    const durationSeconds = Math.max(0, Math.round(Number(request.headers.get('X-Podcast-Duration')) || 0));

    // Stream the body straight into R2 (known length, no buffering).
    await env.AUDIO.put(key, request.body, {
        httpMetadata: { contentType },
        customMetadata: {
            note,
            durationSeconds: String(durationSeconds),
            userAgent: (request.headers.get('User-Agent') ?? '').slice(0, 200),
        },
    });

    // ntfy.sh rejects requests coming from Workers (HTTP 522, verified 2026-11-13), so the
    // recorder page publishes the notification itself. The topic is only revealed to an
    // authenticated uploader.
    return reply(201, { key, notifyTopic: env.NTFY_TOPIC ?? null });
}

function corsHeaders(origin: string | null): Headers {
    const headers = new Headers({ Vary: 'Origin' });
    if (origin && ALLOWED_ORIGINS.some((pattern) => pattern.test(origin))) {
        headers.set('Access-Control-Allow-Origin', origin);
        headers.set('Access-Control-Allow-Methods', 'PUT, OPTIONS');
        headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Podcast-Note, X-Podcast-Duration');
        headers.set('Access-Control-Max-Age', '86400');
    }
    return headers;
}

async function isAuthorized(header: string | null, token: string): Promise<boolean> {
    const provided = header?.match(/^Bearer (.+)$/)?.[1] ?? '';
    // Hash both sides so lengths match, then compare in constant time.
    const encoder = new TextEncoder();
    const [a, b] = await Promise.all([
        crypto.subtle.digest('SHA-256', encoder.encode(provided)),
        crypto.subtle.digest('SHA-256', encoder.encode(token)),
    ]);
    return crypto.subtle.timingSafeEqual(a, b) && provided.length > 0;
}

function safeDecode(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}
