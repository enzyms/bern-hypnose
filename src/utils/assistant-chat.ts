/**
 * Shared client-side chatbot utilities, used by Chat.svelte (widget) and
 * SearchSection.svelte (homepage AI search). Covers: the AnythingLLM
 * streaming protocol, the shared conversation session, and the link
 * guardrail rendering (whitelist + slug rescue + sanitization).
 */
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export const SITE_HOST = 'bern-hypnose.ch';
export const CHAT_EMBED_ID = '090e1c03-3e1e-4e42-a9a5-9a193c659591';
export const CHAT_API_BASE = 'https://chat.bern-hypnose.ch/api/embed';
export const CHAT_SESSION_KEY = 'bh-chat-session';

marked.setOptions({ breaks: true, gfm: true });

export type Source = { title: string; path: string };

/** Search and chat share one backend session so conversations continue seamlessly. */
export function getChatSessionId(): string {
    const stored = localStorage.getItem(CHAT_SESSION_KEY);
    if (stored) return stored;
    const fresh = crypto.randomUUID();
    localStorage.setItem(CHAT_SESSION_KEY, fresh);
    return fresh;
}

export function resetChatSessionId(): string {
    const fresh = crypto.randomUUID();
    localStorage.setItem(CHAT_SESSION_KEY, fresh);
    return fresh;
}

export function track(event: string) {
    (window as unknown as { umami?: { track?: (name: string) => void } }).umami?.track?.(event);
}

// ── Link whitelist (fail-closed) ────────────────────────────────────────

const CORE_PATHS = ['/', '/kontakt/', '/termin/', '/was-ist-hypnose/', '/hypnosetherapie/', '/nutzungsbedingungen/'];
let allowedPaths = new Set(CORE_PATHS);
let whitelistRequested = false;

export async function loadWhitelist() {
    if (whitelistRequested) return;
    whitelistRequested = true;
    try {
        const res = await fetch('/site-urls.json');
        if (!res.ok) return;
        const paths = await res.json();
        if (Array.isArray(paths) && paths.length > 0) {
            allowedPaths = new Set([...CORE_PATHS, ...paths]);
        }
    } catch {
        /* keep fail-closed core list */
    }
}

/** Resolve any href to a canonical internal pathname, or null if external/invalid. */
function toInternalPath(href: string): string | null {
    try {
        const cleaned = href.replace(/^link:\/\//, '');
        const parsed = new URL(cleaned, 'https://' + SITE_HOST);
        const ownHosts = [SITE_HOST, 'www.' + SITE_HOST, typeof location !== 'undefined' ? location.hostname : ''];
        if (!ownHosts.includes(parsed.hostname)) return null;
        // Markdown mirrors map back to their canonical page
        let path = parsed.pathname.replace(/\.md$/, '/').replace(/\/index\/$/, '/');
        if (!path.endsWith('/')) path += '/';
        return path;
    } catch {
        return null;
    }
}

/**
 * Slug rescue: the bot often invents the prefix but gets the slug right
 * (e.g. /faq/kann-ich-kontrolle-verlieren/ instead of
 * /was-ist-hypnose/kann-ich-kontrolle-verlieren/). If the last segment
 * matches exactly one real page, repair the path instead of de-linking.
 */
function rescuePath(path: string): string | null {
    const slug = path.split('/').filter(Boolean).at(-1);
    if (!slug || slug.length < 4) return null;
    const matches = [...allowedPaths].filter((p) => p.endsWith(`/${slug}/`));
    return matches.length === 1 ? matches[0] : null;
}

export function resolvePath(href: string): string | null {
    const path = toInternalPath(href);
    if (!path) return null;
    if (allowedPaths.has(path)) return path;
    return rescuePath(path);
}

/** Turn bare site paths in plain text into (repaired) links. */
function linkifyTextPaths(doc: Document) {
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    let current: Node | null;
    while ((current = walker.nextNode())) {
        if (!(current.parentElement?.closest('a, code, pre'))) nodes.push(current as Text);
    }
    const PATH_RE = /\/[a-z0-9äöüß-]+(?:\/[a-z0-9äöüß-]+)*\/?/gi;
    for (const node of nodes) {
        const text = node.textContent ?? '';
        if (!text.includes('/')) continue;
        const frag = doc.createDocumentFragment();
        let lastIndex = 0;
        let changed = false;
        for (const match of text.matchAll(PATH_RE)) {
            const prev = match.index === 0 ? '' : text[match.index - 1];
            if (prev && !/[\s(>«"':,;!]/.test(prev)) continue;
            const candidate = match[0].endsWith('/') ? match[0] : match[0] + '/';
            const resolved = allowedPaths.has(candidate) ? candidate : rescuePath(candidate);
            if (!resolved) continue;
            frag.appendChild(doc.createTextNode(text.slice(lastIndex, match.index)));
            const a = doc.createElement('a');
            a.setAttribute('href', resolved);
            a.textContent = resolved;
            frag.appendChild(a);
            lastIndex = match.index + match[0].length;
            changed = true;
        }
        if (changed) {
            frag.appendChild(doc.createTextNode(text.slice(lastIndex)));
            node.replaceWith(frag);
        }
    }
}

/**
 * Markdown → sanitized HTML with the link guardrail applied:
 * internal links must be on the whitelist (or slug-rescuable), all
 * others are unwrapped to plain text so hallucinated URLs never reach
 * the user as links.
 */
export function renderAssistantHtml(content: string): string {
    const rawHtml = marked.parse(content) as string;
    const clean = DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } });
    const doc = new DOMParser().parseFromString(clean, 'text/html');
    for (const a of Array.from(doc.querySelectorAll('a'))) {
        const href = a.getAttribute('href') ?? '';
        const resolved = resolvePath(href);
        if (resolved) {
            const parsed = new URL(href, 'https://' + SITE_HOST);
            a.setAttribute('href', resolved + parsed.search + parsed.hash);
            a.removeAttribute('target');
            // If the link text is the (possibly repaired) path itself, show the real one
            const label = a.textContent?.trim() ?? '';
            if (label.startsWith('/') && label !== resolved) a.textContent = resolved;
        } else {
            a.replaceWith(...Array.from(a.childNodes));
        }
    }
    linkifyTextPaths(doc);
    return doc.body.innerHTML;
}

/** Map AnythingLLM source objects onto whitelisted site pages. */
export function resolveSources(raw: unknown[]): Source[] {
    const out: Source[] = [];
    for (const source of raw) {
        if (typeof source !== 'object' || source === null) continue;
        const s = source as Record<string, unknown>;
        const candidate = [s.url, s.link, s.chunkSource, s.title].find(
            (v): v is string => typeof v === 'string' && (v.startsWith('http') || v.startsWith('/') || v.startsWith('link://'))
        );
        const path = candidate ? resolvePath(candidate) : null;
        if (path && !out.some((existing) => existing.path === path)) {
            const title = typeof s.title === 'string' && !s.title.startsWith('http') ? s.title : path;
            out.push({ title, path });
        }
    }
    return out;
}

// ── Streaming ───────────────────────────────────────────────────────────

export const RATE_LIMIT_MESSAGE = 'Die maximale Anzahl an Anfragen wurde erreicht. Bitte versuche es später erneut.';
export const GENERIC_ERROR_MESSAGE = 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.';

/**
 * Stream one assistant reply from the AnythingLLM embed endpoint.
 * onDelta receives incremental text; resolves with the guardrail-filtered
 * sources. Throws Error(RATE_LIMIT_MESSAGE | backend message) on failure.
 */
export async function streamAssistant(message: string, sessionId: string, onDelta: (text: string) => void): Promise<Source[]> {
    const res = await fetch(`${CHAT_API_BASE}/${CHAT_EMBED_ID}/stream-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sessionId })
    });

    if (res.status === 429) throw new Error(RATE_LIMIT_MESSAGE);
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let rawSources: unknown[] = [];

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (!raw || raw === '[DONE]') continue;
            try {
                const data = JSON.parse(raw);
                if (data.error) throw new Error(`Fehler: ${data.error}`);
                if (Array.isArray(data.sources) && data.sources.length > 0) {
                    rawSources = data.sources;
                }
                if (data.textResponse) onDelta(data.textResponse);
            } catch (err) {
                if (err instanceof Error && err.message.startsWith('Fehler:')) throw err;
                /* ignore partial JSON lines */
            }
        }
    }

    return resolveSources(rawSources);
}
