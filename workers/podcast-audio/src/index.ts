/**
 * Serves published podcast episodes from the private R2 bucket.
 *
 * Netlify proxies https://bern-hypnose.ch/podcast-audio/<name>.mp3 to this Worker
 * (200 rewrite in netlify.toml), which maps it to the R2 key `episodes/<name>.mp3`.
 * Raw uploads in `inbox/` are never reachable: only strict filenames are accepted
 * and the `episodes/` prefix is always prepended.
 */

export interface Env {
    AUDIO: R2Bucket;
}

const KEY_PREFIX = 'episodes/';
const FILENAME = /^[a-z0-9][a-z0-9-]*\.mp3$/;
const CACHE_CONTROL = 'public, max-age=86400';

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
        }

        // Accept both "/<name>.mp3" (Netlify :splat) and "/podcast-audio/<name>.mp3".
        const name = new URL(request.url).pathname.replace(/^\/(podcast-audio\/)?/, '');
        if (!FILENAME.test(name)) {
            return new Response('Not Found', { status: 404 });
        }
        const key = KEY_PREFIX + name;

        if (request.method === 'HEAD') {
            const head = await env.AUDIO.head(key);
            if (!head) return new Response(null, { status: 404 });
            return new Response(null, { status: 200, headers: baseHeaders(head, head.size) });
        }

        let object: R2Object | R2ObjectBody | null;
        try {
            object = await env.AUDIO.get(key, { range: request.headers, onlyIf: request.headers });
        } catch {
            // R2 rejects unsatisfiable ranges.
            const head = await env.AUDIO.head(key);
            if (!head) return new Response('Not Found', { status: 404 });
            return new Response(null, {
                status: 416,
                headers: { 'Content-Range': `bytes */${head.size}`, 'Accept-Ranges': 'bytes' },
            });
        }

        if (!object) return new Response('Not Found', { status: 404 });

        // Precondition (If-None-Match / If-Modified-Since) matched: no body returned.
        if (!('body' in object)) {
            return new Response(null, { status: 304, headers: baseHeaders(object) });
        }

        const rangeHeader = request.headers.get('range');
        const requestedStart = rangeHeader?.match(/^bytes=(\d+)-/)?.[1];
        if (requestedStart !== undefined && Number(requestedStart) >= object.size) {
            // Some R2 implementations ignore an out-of-bounds range instead of throwing.
            await object.body.cancel();
            return new Response(null, {
                status: 416,
                headers: { 'Content-Range': `bytes */${object.size}`, 'Accept-Ranges': 'bytes' },
            });
        }

        const range = rangeHeader ? object.range : undefined;
        if (range) {
            const { start, end } = resolveRange(range, object.size);
            const headers = baseHeaders(object, end - start + 1);
            headers.set('Content-Range', `bytes ${start}-${end}/${object.size}`);
            return new Response(object.body, { status: 206, headers });
        }

        return new Response(object.body, { status: 200, headers: baseHeaders(object, object.size) });
    },
} satisfies ExportedHandler<Env>;

function baseHeaders(object: R2Object, contentLength?: number): Headers {
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'audio/mpeg');
    headers.set('ETag', object.httpEtag);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', CACHE_CONTROL);
    if (contentLength !== undefined) headers.set('Content-Length', String(contentLength));
    return headers;
}

function resolveRange(range: R2Range, size: number): { start: number; end: number } {
    if ('suffix' in range && range.suffix !== undefined) {
        return { start: Math.max(0, size - range.suffix), end: size - 1 };
    }
    const start = 'offset' in range && range.offset !== undefined ? range.offset : 0;
    const end = 'length' in range && range.length !== undefined ? Math.min(start + range.length, size) - 1 : size - 1;
    return { start, end };
}
