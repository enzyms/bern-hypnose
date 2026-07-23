<script lang="ts">
    import { onMount } from 'svelte';
    import { fly } from 'svelte/transition';
    import { marked } from 'marked';
    import DOMPurify from 'dompurify';

    const SITE_HOST = 'bern-hypnose.ch';

    marked.setOptions({ breaks: true, gfm: true });

    const EMBED_ID = '090e1c03-3e1e-4e42-a9a5-9a193c659591';
    const API_BASE = 'https://chat.bern-hypnose.ch/api/embed';
    const SESSION_KEY = 'bh-chat-session';

    type Source = { title: string; path: string };
    type Message = { role: 'user' | 'assistant'; content: string; sources?: Source[] };

    // Fail-closed link whitelist: until /site-urls.json is loaded, only these
    // core pages may be linked; everything else is rendered as plain text.
    const CORE_PATHS = ['/', '/kontakt/', '/termin/', '/was-ist-hypnose/', '/hypnosetherapie/', '/nutzungsbedingungen/'];
    let allowedPaths = new Set(CORE_PATHS);
    let whitelistRequested = false;

    async function loadWhitelist() {
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

    function resolvePath(href: string): string | null {
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
    function renderAssistantHtml(content: string): string {
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
    function resolveSources(raw: unknown[]): Source[] {
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

    function track(event: string) {
        (window as unknown as { umami?: { track?: (name: string) => void } }).umami?.track?.(event);
    }

    let isOpen = $state(false);
    let messages = $state<Message[]>([]);
    let inputValue = $state('');
    let isStreaming = $state(false);
    let sessionId = $state('');
    let messagesEl = $state<HTMLDivElement | undefined>(undefined);

    const SUGGESTED = [
        'Was ist Hypnosetherapie?',
        'Wie läuft eine Sitzung ab?',
        'Verliere ich die Kontrolle?',
        'Wie viele Sitzungen brauche ich?',
        'Für wen ist Hypnosetherapie geeignet?'
    ];

    onMount(() => {
        const stored = localStorage.getItem(SESSION_KEY);
        sessionId = stored ?? crypto.randomUUID();
        if (!stored) localStorage.setItem(SESSION_KEY, sessionId);

        const openChat = () => {
            isOpen = true;
        };
        window.addEventListener('open-chat', openChat);
        return () => window.removeEventListener('open-chat', openChat);
    });

    let lastUserMsgEl = $state<HTMLSpanElement | undefined>(undefined);

    /**
     * Give the last assistant message enough min-height so the user's
     * question can be scrolled to the top of the container, then scroll.
     */
    function scrollQuestionIntoView() {
        requestAnimationFrame(() => {
            if (!lastUserMsgEl || !messagesEl) return;

            // Find the last assistant message element
            const lastAssistantEl = messagesEl.querySelector('.bh-chat__msg--assistant:last-child') as HTMLElement | null;
            if (lastAssistantEl) {
                const containerH = messagesEl.clientHeight;
                const paddingTop = parseFloat(getComputedStyle(messagesEl).paddingTop);
                const gap = parseFloat(getComputedStyle(messagesEl).gap) || 0;
                const questionH = lastUserMsgEl.closest('.bh-chat__msg')?.getBoundingClientRect().height ?? 0;
                const minH = containerH - paddingTop - questionH - gap;
                lastAssistantEl.style.minHeight = `${Math.max(minH, 0)}px`;
            }

            // Now scroll the question to the top
            const containerTop = messagesEl.getBoundingClientRect().top;
            const elTop = lastUserMsgEl.getBoundingClientRect().top;
            const paddingTop = parseFloat(getComputedStyle(messagesEl).paddingTop);
            messagesEl.scrollTo({
                top: messagesEl.scrollTop + (elTop - containerTop) - paddingTop,
                behavior: 'smooth'
            });
        });
    }

    async function sendMessage(text: string) {
        const trimmed = text.trim();
        if (!trimmed || isStreaming) return;

        inputValue = '';

        // Reset min-height on previous assistant messages
        if (messagesEl) {
            messagesEl.querySelectorAll<HTMLElement>('.bh-chat__msg--assistant').forEach((el) => {
                el.style.minHeight = '';
            });
        }

        messages.push({ role: 'user', content: trimmed });
        messages.push({ role: 'assistant', content: '' });
        const lastIdx = messages.length - 1;
        isStreaming = true;
        track('Chat Frage gesendet');
        // Wait for DOM update, then anchor the question at the top
        setTimeout(() => scrollQuestionIntoView(), 30);

        try {
            const res = await fetch(`${API_BASE}/${EMBED_ID}/stream-chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: trimmed, sessionId })
            });

            if (res.status === 429) {
                messages[lastIdx].content = 'Die maximale Anzahl an Anfragen wurde erreicht. Bitte versuche es später erneut.';
                return;
            }
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
                        if (data.error) {
                            messages[lastIdx].content = `Fehler: ${data.error}`;
                            return;
                        }
                        if (Array.isArray(data.sources) && data.sources.length > 0) {
                            rawSources = data.sources;
                        }
                        if (data.textResponse) {
                            messages[lastIdx].content += data.textResponse;
                        }
                    } catch {
                        /* ignore partial JSON lines */
                    }
                }
            }

            messages[lastIdx].sources = resolveSources(rawSources);
            track('Chat Antwort erhalten');
        } catch {
            messages[lastIdx].content = 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.';
        } finally {
            isStreaming = false;
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(inputValue);
        }
    }

    function resetChat() {
        messages = [];
        sessionId = crypto.randomUUID();
        localStorage.setItem(SESSION_KEY, sessionId);
    }

    let bubbleEl = $state<HTMLButtonElement | undefined>(undefined);
    let panelEl = $state<HTMLDivElement | undefined>(undefined);
    let inputEl = $state<HTMLInputElement | undefined>(undefined);

    // Focus management: move focus into panel on open, back to bubble on close
    $effect(() => {
        if (isOpen) {
            loadWhitelist();
            track('Chat geöffnet');
            requestAnimationFrame(() => inputEl?.focus());
        }
    });

    function closeChat() {
        isOpen = false;
        requestAnimationFrame(() => bubbleEl?.focus());
    }

    function handleMessageClick(e: MouseEvent) {
        const link = (e.target as HTMLElement).closest('a');
        if (link && link.hostname === location.hostname) {
            isOpen = false;
        }
    }

    function handlePanelKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
            e.stopPropagation();
            closeChat();
        }
    }
</script>

<div class="bh-chat">
    {#if isOpen}
        <button class="bh-chat__veil" transition:fly={{ duration: 250 }} onclick={closeChat} aria-label="Chat schließen"></button>
    {/if}
    <div
        class="bh-chat__panel"
        class:bh-chat__panel--hidden={!isOpen}
        bind:this={panelEl}
        role="dialog"
        aria-label="Chatbot"
        aria-hidden={!isOpen}
        onkeydown={handlePanelKeydown}
    >
            <!-- Header -->
            <div class="bh-chat__header">
                <div class="bh-chat__header-actions">
                    {#if messages.length > 0}
                        <button class="bh-chat__icon-btn" onclick={resetChat} aria-label="Gespräch zurücksetzen">
                            <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                <path d="M3 3v5h5" />
                            </svg>
                        </button>
                    {/if}
                    <button class="bh-chat__icon-btn" onclick={closeChat} aria-label="Chat schließen">
                        <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Messages -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="bh-chat__messages" bind:this={messagesEl} role="log" aria-live="polite" aria-label="Chatverlauf" onclick={handleMessageClick}>
                {#if messages.length === 0}
                    <div class="bh-chat__greeting">
                        <p class="text-balance">Hallo! Ich bin Janines virtuelle Assistentin. Ich beantworte gerne deine Fragen zur Hypnosetherapie.</p>
                        <div class="bh-chat__suggestions" role="group" aria-label="Vorgeschlagene Fragen">
                            {#each SUGGESTED as q}
                                <button class="bh-chat__suggestion" onclick={() => sendMessage(q)}>{q}</button>
                            {/each}
                        </div>
                        <p class="bh-chat__disclaimer text-balance">
                            Dieser Chatbot bietet allgemeine Informationen und ersetzt keine professionelle Beratung. Sie können die <a
                                href="/nutzungsbedingungen/">Nutzungsbedingungen</a
                            >
                            lesen.
                        </p>
                    </div>
                {:else}
                    {#each messages as msg, i}
                        <div class="bh-chat__msg bh-chat__msg--{msg.role}">
                            {#if msg.role === 'user'}
                                <span class="bh-chat__anchor" bind:this={lastUserMsgEl}></span>
                            {/if}
                            {#if msg.role === 'assistant' && msg.content === '' && isStreaming}
                                <span class="bh-chat__typing" role="status" aria-label="Antwort wird geschrieben"><span></span><span></span><span></span></span>
                            {:else if msg.role === 'assistant'}
                                {@html renderAssistantHtml(msg.content)}
                                {#if msg.sources && msg.sources.length > 0}
                                    <div class="bh-chat__sources" aria-label="Quellen">
                                        <span class="bh-chat__sources-label">Quellen:</span>
                                        {#each msg.sources as source}
                                            <a class="bh-chat__source-chip" href={source.path}>{source.title}</a>
                                        {/each}
                                    </div>
                                {/if}
                            {:else}
                                {msg.content}
                            {/if}
                        </div>
                    {/each}
                {/if}
            </div>

            <!-- Input -->
            <div class="bh-chat__input-bar">
                <label for="bh-chat-input" class="sr-only">Deine Frage</label>
                <input
                    id="bh-chat-input"
                    class="bh-chat__input"
                    type="text"
                    placeholder="Deine Frage..."
                    bind:this={inputEl}
                    bind:value={inputValue}
                    onkeydown={handleKeydown}
                    disabled={isStreaming}
                />
                <button
                    class="bh-chat__send"
                    onclick={() => sendMessage(inputValue)}
                    disabled={isStreaming || !inputValue.trim()}
                    aria-label="Nachricht senden"
                >
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="m22 2-7 20-4-9-9-4 20-7z" />
                        <path d="M22 2 11 13" />
                    </svg>
                </button>
            </div>
        </div>

    <!-- Bubble -->
    <button class="bh-chat__bubble" bind:this={bubbleEl} onclick={() => (isOpen = !isOpen)} aria-label={isOpen ? 'Chat schließen' : 'Chat öffnen'}>
        {#if isOpen}
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M18 6 6 18M6 6l12 12" />
            </svg>
        {:else}
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
        {/if}
    </button>
</div>

<style>
    .bh-chat__veil {
        position: fixed;
        inset: 0;
        z-index: -1;
        background: rgba(107, 74, 117, 0.35);
        border: none;
        padding: 0;
        cursor: default;
    }

    .bh-chat {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 12px;
        font-family:
            system-ui,
            -apple-system,
            sans-serif;
        line-height: 1.75;
    }

    /* Panel */
    .bh-chat__panel {
        width: min(580px, calc(100vw - 40px));
        height: max(540px, calc(100svh - 110px));
        background: #f7f0f8;
        border-radius: 16px;
        box-shadow: 0 8px 40px rgba(0, 0, 0, 0.18);
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
    .bh-chat__panel--hidden {
        display: none;
    }

    /* Header */
    .bh-chat__header {
        display: flex;
        justify-content: flex-end;
        width: 100%;
        padding: 20px 20px;
        background: transparent;
        flex-shrink: 0;
        position: absolute;
    }

    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }

    .bh-chat__header-actions {
        display: flex;
        justify-content: flex-end;
        gap: 4px;
    }

    .bh-chat__icon-btn {
        background: #9b50b0;
        border: none;
        color: #fff;
        cursor: pointer;
        padding: 10px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.8;
        transition:
            opacity 0.15s,
            background 0.15s;
    }
    .bh-chat__icon-btn:hover {
        opacity: 1;
        background: #b06ec7;
    }

    /* Messages */
    .bh-chat__messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        padding-top: 80px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        -webkit-overflow-scrolling: touch;
    }

    .bh-chat__greeting {
        display: flex;
        flex-direction: column;
        gap: 40px;
        color: #333;
    }

    .bh-chat__greeting p {
        margin: 0;
    }

    .bh-chat__disclaimer {
        font-size: 0.85rem;
        line-height: 1.5;
        opacity: 0.8;
    }
    .bh-chat__disclaimer a {
        color: inherit;
        text-decoration: underline;
    }

    .bh-chat__suggestions {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .bh-chat__suggestion {
        background: #f3e8f4;
        border: 2px solid transparent;
        border-radius: 8px;
        padding: 12px 16px;
        text-align: left;
        cursor: pointer;
        color: #333;
        line-height: 1.5;
        transition:
            background 0.15s,
            border-color 0.15s;
        font-family: inherit;
    }
    .bh-chat__suggestion:hover {
        background: #ead7eb;
    }

    .bh-chat__msg {
        max-width: 100%;
        border-radius: 14px;
        line-height: 1.5;
        word-break: break-word;
    }

    .bh-chat__msg--user {
        max-width: 85%;
        padding: 12px 14px;
        white-space: pre-wrap;
        align-self: flex-end;
        background: #e9d7eb;
        color: #0b0b0b;
        border-bottom-right-radius: 4px;
    }

    .bh-chat__anchor {
        display: block;
        height: 0;
        overflow: hidden;
    }

    .bh-chat__msg--assistant {
        align-self: flex-start;
        color: #0b0b0b;
        border-bottom-left-radius: 4px;
        padding-bottom: 70px;
    }

    /* Markdown content in assistant messages */
    .bh-chat__msg--assistant :global(p) {
        margin: 0 0 0.5em;
    }
    .bh-chat__msg--assistant :global(p:last-child) {
        margin-bottom: 0;
    }
    .bh-chat__msg--assistant :global(strong) {
        font-weight: 600;
    }
    .bh-chat__msg--assistant :global(a) {
        color: #b06ec7;
        text-decoration: underline;
        text-underline-offset: 2px;
    }
    .bh-chat__msg--assistant :global(a:hover) {
        color: #9b50b0;
    }
    .bh-chat__msg--assistant :global(ul),
    .bh-chat__msg--assistant :global(ol) {
        margin: 0.4em 0;
        padding-left: 1em;
        list-style: disc;
    }
    .bh-chat__msg--assistant :global(li) {
        margin-bottom: 0.25em;
    }
    .bh-chat__msg--assistant :global(code) {
        background: rgba(0, 0, 0, 0.06);
        padding: 0.15em 0.35em;
        border-radius: 4px;
        font-size: 0.9em;
    }
    .bh-chat__msg--assistant :global(table) {
        display: block;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        font-size: 0.85em;
        border-collapse: collapse;
        max-width: 100%;
    }
    .bh-chat__msg--assistant :global(th),
    .bh-chat__msg--assistant :global(td) {
        padding: 0.4em 0.6em;
        border: 1px solid #d4a8e0;
        white-space: nowrap;
    }
    .bh-chat__msg--assistant :global(th) {
        background: #f3e8f4;
        font-weight: 600;
    }
    .bh-chat__msg--assistant :global(blockquote) {
        border-left: 3px solid #d4a8e0;
        margin: 0.4em 0;
        padding: 0.2em 0.8em;
        color: #555;
    }

    /* Sources */
    .bh-chat__sources {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        margin-top: 10px;
        font-size: 0.82rem;
    }
    .bh-chat__sources-label {
        color: #555;
    }
    .bh-chat__source-chip {
        background: #f3e8f4;
        border-radius: 999px;
        padding: 3px 12px;
        color: #7a3d8f;
        text-decoration: none;
        transition: background 0.15s;
    }
    .bh-chat__source-chip:hover {
        background: #ead7eb;
    }

    /* Typing indicator */
    .bh-chat__typing {
        display: flex;
        gap: 4px;
        align-items: center;
        padding: 2px 0;
    }

    .bh-chat__typing span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #9b6e9b;
        display: block;
        animation: bh-bounce 1.2s ease-in-out infinite;
    }
    .bh-chat__typing span:nth-child(2) {
        animation-delay: 0.2s;
    }
    .bh-chat__typing span:nth-child(3) {
        animation-delay: 0.4s;
    }

    @keyframes bh-bounce {
        0%,
        60%,
        100% {
            transform: translateY(0);
        }
        30% {
            transform: translateY(-6px);
        }
    }

    /* Input bar */
    .bh-chat__input-bar {
        display: flex;
        gap: 8px;
        padding: 12px 14px;
        border-top: 2px solid #f3e8f4;
        background: #f7f0f8;
        flex-shrink: 0;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
    }

    .bh-chat__input {
        flex: 1;
        border: 1px solid #e5e5e5;
        border-radius: 10px;
        padding: 13px 20px;
        outline: none;
        transition: border-color 0.15s;
        background: #fff;
        color: #0b0b0b;
        font-family: inherit;
    }
    .bh-chat__input:focus {
        border-color: #b06ec7;
    }
    .bh-chat__input:disabled {
        opacity: 0.6;
    }

    .bh-chat__send {
        background: #b06ec7;
        border: none;
        border-radius: 10px;
        padding: 10px 18px;
        color: #fff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s;
        flex-shrink: 0;
    }
    .bh-chat__send:hover:not(:disabled) {
        background: #9b50b0;
    }
    .bh-chat__send:disabled {
        opacity: 0.45;
        cursor: not-allowed;
    }

    .bh-chat__send svg {
        width: 20px;
        height: 20px;
    }

    /* Bubble */
    .bh-chat__bubble {
        width: 54px;
        height: 54px;
        border-radius: 50%;
        background: #b06ec7;
        border: none;
        color: #fff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 18px rgba(176, 110, 199, 0.45);
        transition:
            transform 0.2s,
            box-shadow 0.2s;
        flex-shrink: 0;
    }
    .bh-chat__bubble:hover {
        transform: scale(1.06);
        box-shadow: 0 6px 24px rgba(176, 110, 199, 0.55);
    }
</style>
