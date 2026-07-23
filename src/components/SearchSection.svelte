<script lang="ts">
    import { onMount } from 'svelte';
    import {
        type Source,
        getChatSessionId,
        loadWhitelist,
        renderAssistantHtml,
        streamAssistant,
        track,
        RATE_LIMIT_MESSAGE,
        GENERIC_ERROR_MESSAGE
    } from '../utils/assistant-chat';

    const CONSENT_KEY = 'bh-ai-consent';
    const DECLINE_KEY = 'bh-ai-consent-declined-until';
    const DECLINE_DAYS = 3;

    type IndexEntry = { path: string; title: string; description: string; collection: string };

    const SUGGESTED = ['Wobei kann Hypnose helfen?', 'Was kostet eine Sitzung?', 'Verliere ich die Kontrolle?', 'Hilft Hypnose beim Rauchstopp?'];

    const COLLECTION_LABEL: Record<string, string> = {
        blog: 'Blog',
        faq: 'FAQ',
        pages: '',
        static: ''
    };

    let query = $state('');
    let results = $state<IndexEntry[]>([]);
    let aiQuestion = $state('');
    let aiAnswer = $state('');
    let aiSources = $state<Source[]>([]);
    let isStreaming = $state(false);
    let aiError = $state('');

    // AI answers are opt-in: first submit shows a consent notice (stored once);
    // a refusal is remembered for a few days before asking again.
    let consented = $state(false);
    let declinedUntil = $state(0);
    let pendingQuestion = $state('');

    // Short placeholder by default (mobile-safe); expanded on wider screens after mount
    let placeholder = $state('Frag etwas über Hypnose…');

    onMount(() => {
        // (/?reset-ai-consent is handled by an inline script in index.astro —
        // it must run before hydration, which can be lazy or skipped.)
        consented = localStorage.getItem(CONSENT_KEY) === '1';
        declinedUntil = Number(localStorage.getItem(DECLINE_KEY) ?? 0);

        const wide = window.matchMedia('(min-width: 640px)');
        const applyPlaceholder = () => {
            placeholder = wide.matches ? 'Wobei kann Hypnose dir helfen? Frag oder such…' : 'Frag etwas über Hypnose…';
        };
        applyPlaceholder();
        wide.addEventListener('change', applyPlaceholder);
        return () => wide.removeEventListener('change', applyPlaceholder);
    });

    let index: IndexEntry[] | null = null;
    let indexRequested = false;

    async function loadIndex() {
        if (indexRequested) return;
        indexRequested = true;
        loadWhitelist();
        try {
            const res = await fetch('/search-index.json');
            if (res.ok) index = await res.json();
            // The user may already be typing when the index arrives
            if (query.trim()) results = search(query);
        } catch {
            index = null;
        }
    }

    function normalize(text: string): string {
        return text.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
    }

    /** Instant local scoring: title matches weigh 3×, description 1×, word-prefix bonus. */
    function search(q: string): IndexEntry[] {
        if (!index || q.trim().length < 2) return [];
        const tokens = normalize(q).split(/\s+/).filter((t) => t.length >= 2);
        if (!tokens.length) return [];
        return index
            .map((entry) => {
                const title = normalize(entry.title);
                const description = normalize(entry.description ?? '');
                let score = 0;
                for (const token of tokens) {
                    if (title.includes(token)) score += 3;
                    if (new RegExp(`(^|[\\s-])${token}`).test(title)) score += 1;
                    if (description.includes(token)) score += 1;
                }
                return { entry, score };
            })
            .filter((r) => r.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 6)
            .map((r) => r.entry);
    }

    function handleInput() {
        results = search(query);
    }

    async function submit(text?: string) {
        const trimmed = (text ?? query).trim();
        if (!trimmed || isStreaming) return;
        if (text) {
            query = text;
            results = search(text);
        }
        await loadIndex();

        if (!consented) {
            if (Date.now() < declinedUntil) return; // recently declined — page search only
            pendingQuestion = trimmed;
            return;
        }
        runAi(trimmed);
    }

    function acceptConsent() {
        consented = true;
        localStorage.setItem(CONSENT_KEY, '1');
        track('Suche – KI-Consent akzeptiert');
        const question = pendingQuestion;
        pendingQuestion = '';
        if (question) runAi(question);
    }

    function declineConsent() {
        pendingQuestion = '';
        declinedUntil = Date.now() + DECLINE_DAYS * 86400000;
        localStorage.setItem(DECLINE_KEY, String(declinedUntil));
        track('Suche – KI-Consent abgelehnt');
    }

    async function runAi(question: string) {
        aiQuestion = question;
        aiAnswer = '';
        aiSources = [];
        aiError = '';
        isStreaming = true;
        track('Suche – KI-Antwort');

        try {
            // Same backend session as the chat widget — the conversation continues there.
            aiSources = await streamAssistant(question, getChatSessionId(), (delta) => {
                aiAnswer += delta;
            });
        } catch (err) {
            aiError = err instanceof Error && (err.message === RATE_LIMIT_MESSAGE || err.message.startsWith('Fehler:')) ? err.message : GENERIC_ERROR_MESSAGE;
        } finally {
            isStreaming = false;
        }
    }

    function continueInChat() {
        track('Suche – Chat Handoff');
        window.dispatchEvent(
            new CustomEvent('open-chat', {
                detail: { seed: { question: aiQuestion, answer: aiAnswer, sources: aiSources } }
            })
        );
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter') {
            e.preventDefault();
            submit();
        }
    }

    let searched = $state(false);
    function handleFocus() {
        loadIndex();
        if (!searched) {
            searched = true;
            track('Suche verwendet');
        }
    }
</script>

<section class="bh-search not-prose" aria-label="Suche und KI-Antwort">
    <div class="bh-search__box">
        <label for="bh-search-input" class="sr-only">Frage oder Suchbegriff</label>
        <div class="bh-search__input-row">
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="bh-search__icon">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
            </svg>
            <input
                id="bh-search-input"
                type="text"
                {placeholder}
                bind:value={query}
                oninput={handleInput}
                onfocus={handleFocus}
                onkeydown={handleKeydown}
                autocomplete="off"
            />
            <button class="bh-search__submit" onclick={() => submit()} disabled={isStreaming || !query.trim()} aria-label="Suchen und KI fragen">
                {isStreaming ? '…' : '✨ Fragen'}
            </button>
        </div>

        {#if !aiQuestion && !results.length && !pendingQuestion}
            <div class="bh-search__chips" role="group" aria-label="Vorgeschlagene Fragen">
                {#each SUGGESTED as suggestion}
                    <button class="bh-search__chip" onclick={() => submit(suggestion)}>{suggestion}</button>
                {/each}
            </div>
        {/if}

        {#if pendingQuestion && !consented}
            <div class="bh-search__consent" role="alertdialog" aria-label="Einwilligung KI-Antwort">
                <p>
                    <strong>✨ KI-Antwort aktivieren?</strong> Deine Frage wird anonym an unseren Chatbot übermittelt und gespeichert.
                    <a href="/datenschutzrichtlinie/">Datenschutz</a> · <a href="/nutzungsbedingungen/">Nutzungsbedingungen</a>
                </p>
                <div class="bh-search__consent-actions">
                    <button class="bh-search__consent-yes" onclick={acceptConsent}>Einverstanden – Antwort anzeigen</button>
                    <button class="bh-search__consent-no" onclick={declineConsent}>Nur Seiten durchsuchen</button>
                </div>
            </div>
        {/if}

        {#if aiQuestion}
            <div class="bh-search__answer" aria-live="polite">
                <div class="bh-search__answer-label">✨ KI-Antwort</div>
                {#if aiError}
                    <p class="bh-search__error">{aiError}</p>
                {:else if !aiAnswer && isStreaming}
                    <span class="bh-search__typing" role="status" aria-label="Antwort wird geschrieben"><span></span><span></span><span></span></span>
                {:else}
                    <div class="bh-search__answer-text">{@html renderAssistantHtml(aiAnswer)}</div>
                {/if}
                {#if aiSources.length > 0}
                    <div class="bh-search__sources">
                        <span>Quellen:</span>
                        {#each aiSources as source}
                            <a href={source.path}>{source.title}</a>
                        {/each}
                    </div>
                {/if}
                {#if aiAnswer && !isStreaming && !aiError}
                    <button class="bh-search__continue" onclick={continueInChat}>Im Chat weiterfragen →</button>
                {/if}
            </div>
        {/if}

        {#if results.length > 0}
            <div class="bh-search__results">
                <div class="bh-search__results-label">Passende Seiten</div>
                <ul>
                    {#each results as result}
                        <li>
                            <a href={result.path}>
                                <span class="bh-search__result-title">{result.title}</span>
                                {#if COLLECTION_LABEL[result.collection]}
                                    <span class="bh-search__badge">{COLLECTION_LABEL[result.collection]}</span>
                                {/if}
                                {#if result.description}
                                    <span class="bh-search__result-desc">{result.description}</span>
                                {/if}
                            </a>
                        </li>
                    {/each}
                </ul>
            </div>
        {/if}

        <p class="bh-search__privacy">
            Die Seitensuche läuft komplett in deinem Browser. Die KI-Antwort (opt-in) beantwortet ein
            <a href="/datenschutzrichtlinie/#7-ki-chatbot-und-ki-antworten-in-der-suche">ethischer Chatbot</a>.
        </p>
    </div>
</section>

<style>
    .bh-search {
        margin: 2.5rem 0 3rem;
    }

    .bh-search__box {
        background: rgba(247, 240, 248, 0.75);
        backdrop-filter: blur(6px);
        border: 1px solid #ead7eb;
        border-radius: 18px;
        padding: 16px;
        box-shadow: 0 4px 24px rgba(155, 80, 176, 0.08);
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

    .bh-search__input-row {
        display: flex;
        align-items: center;
        gap: 10px;
        background: #fff;
        border: 1px solid #e5e5e5;
        border-radius: 12px;
        padding: 4px 6px 4px 14px;
        transition: border-color 0.15s;
    }
    .bh-search__input-row:focus-within {
        border-color: #b06ec7;
    }

    .bh-search__icon {
        color: #9b50b0;
        flex-shrink: 0;
    }

    .bh-search__input-row input::placeholder {
        color: #595959;
        opacity: 1;
    }
    .bh-search__input-row input {
        flex: 1;
        border: none;
        outline: none;
        padding: 11px 0;
        background: transparent;
        color: #0b0b0b;
        font-family: inherit;
        font-size: 1rem;
        min-width: 0;
    }

    .bh-search__submit {
        background: #9b50b0;
        border: none;
        border-radius: 9px;
        padding: 10px 16px;
        color: #fff;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
        transition: background 0.15s;
        font-family: inherit;
    }
    .bh-search__submit:hover:not(:disabled) {
        background: #7a3d8f;
    }
    .bh-search__submit:disabled {
        /* explicit disabled colors instead of opacity — stays ≥ 4.5:1 (AA) */
        background: #f0eaf2;
        color: #595959;
        border: 1px solid #c9bccd;
        cursor: not-allowed;
    }

    /* Narrow screens: stack the button under the input, full width */
    @media (max-width: 480px) {
        .bh-search__box {
            padding: 12px;
        }
        .bh-search__input-row {
            flex-wrap: wrap;
            padding: 6px 8px;
        }
        .bh-search__input-row input {
            padding: 10px 0;
            font-size: 16px; /* prevents iOS zoom-on-focus */
        }
        .bh-search__submit {
            flex: 1 1 100%;
            padding: 11px 16px;
        }
        /* Suggested questions are noise on small screens */
        .bh-search__chips {
            display: none;
        }
    }

    .bh-search__chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
    }

    .bh-search__chip {
        background: rgba(255, 255, 255, 0.85);
        border: 1px solid #d9c3dd;
        border-radius: 999px;
        padding: 7px 14px;
        font-size: 0.875rem;
        color: #222;
        cursor: pointer;
        transition:
            background 0.15s,
            border-color 0.15s;
        font-family: inherit;
    }
    .bh-search__chip:hover {
        background: #fff;
        border-color: #b06ec7;
    }

    .bh-search__consent {
        margin-top: 14px;
        background: #fff;
        border: 1px solid #ead7eb;
        border-radius: 12px;
        padding: 14px 16px;
        font-size: 0.9rem;
        color: #333;
    }
    .bh-search__consent p {
        margin: 0 0 10px;
        line-height: 1.5;
    }
    .bh-search__consent a {
        color: #7a3d8f;
        text-decoration: underline;
        text-underline-offset: 2px;
    }
    .bh-search__consent-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }
    .bh-search__consent-yes {
        background: #9b50b0;
        border: none;
        border-radius: 999px;
        padding: 8px 16px;
        color: #fff;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
    }
    .bh-search__consent-yes:hover {
        background: #7a3d8f;
    }
    .bh-search__consent-no {
        background: transparent;
        border: 1px solid #d4a8e0;
        border-radius: 999px;
        padding: 8px 16px;
        color: #7a3d8f;
        cursor: pointer;
        font-family: inherit;
    }
    .bh-search__consent-no:hover {
        background: #f3e8f4;
    }

    .bh-search__privacy {
        margin: 12px 2px 0;
        font-size: 0.78rem;
        color: #494949; /* ≥ 4.5:1 (AA) on the pale lilac box */
        line-height: 1.4;
    }
    .bh-search__privacy a {
        color: inherit;
        text-decoration: underline;
        text-underline-offset: 2px;
    }
    .bh-search__privacy a:hover {
        color: #7a3d8f;
    }

    .bh-search__answer {
        margin-top: 14px;
        background: #fff;
        border: 1px solid #ead7eb;
        border-radius: 12px;
        padding: 16px 18px;
    }

    .bh-search__answer-label {
        font-size: 0.8rem;
        font-weight: 700;
        color: #9b50b0;
        letter-spacing: 0.02em;
        margin-bottom: 8px;
    }

    .bh-search__answer-text {
        color: #0b0b0b;
        line-height: 1.6;
    }
    .bh-search__answer-text :global(p) {
        margin: 0 0 0.5em;
    }
    .bh-search__answer-text :global(p:last-child) {
        margin-bottom: 0;
    }
    .bh-search__answer-text :global(a) {
        color: #7a3d8f;
        text-decoration: underline;
        text-underline-offset: 2px;
    }
    .bh-search__answer-text :global(a:hover) {
        color: #9b50b0;
    }
    .bh-search__answer-text :global(ul),
    .bh-search__answer-text :global(ol) {
        margin: 0.4em 0;
        padding-left: 1.1em;
        list-style: disc;
    }

    .bh-search__error {
        color: #b91c1c;
        margin: 0;
    }

    .bh-search__sources {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        margin-top: 12px;
        font-size: 0.82rem;
        color: #555;
    }
    .bh-search__sources a {
        background: #f3e8f4;
        border-radius: 999px;
        padding: 3px 12px;
        color: #7a3d8f;
        text-decoration: none;
        transition: background 0.15s;
    }
    .bh-search__sources a:hover {
        background: #ead7eb;
    }

    .bh-search__continue {
        margin-top: 12px;
        background: transparent;
        border: 1px solid #b06ec7;
        border-radius: 999px;
        padding: 7px 16px;
        color: #9b50b0;
        font-weight: 700;
        cursor: pointer;
        transition:
            background 0.15s,
            color 0.15s;
        font-family: inherit;
    }
    .bh-search__continue:hover {
        background: #b06ec7;
        color: #fff;
    }

    .bh-search__typing {
        display: flex;
        gap: 4px;
        align-items: center;
        padding: 4px 0;
    }
    .bh-search__typing span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #9b6e9b;
        display: block;
        animation: bh-search-bounce 1.2s ease-in-out infinite;
    }
    .bh-search__typing span:nth-child(2) {
        animation-delay: 0.2s;
    }
    .bh-search__typing span:nth-child(3) {
        animation-delay: 0.4s;
    }
    @keyframes bh-search-bounce {
        0%,
        60%,
        100% {
            transform: translateY(0);
        }
        30% {
            transform: translateY(-6px);
        }
    }

    .bh-search__results {
        margin-top: 14px;
    }

    .bh-search__results-label {
        font-size: 0.8rem;
        font-weight: 700;
        color: #555;
        letter-spacing: 0.02em;
        margin-bottom: 6px;
    }

    .bh-search__results ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .bh-search__results a {
        display: block;
        padding: 9px 12px;
        border-radius: 10px;
        text-decoration: none;
        transition: background 0.15s;
    }
    .bh-search__results a:hover {
        background: rgba(255, 255, 255, 0.9);
    }

    .bh-search__result-title {
        font-weight: 700;
        color: #b91c1c;
        margin-right: 6px;
    }
    .bh-search__results a:hover .bh-search__result-title {
        color: #991b1b;
    }

    .bh-search__badge {
        font-size: 0.7rem;
        font-weight: 700;
        color: #7a3d8f;
        background: #f3e8f4;
        border-radius: 999px;
        padding: 1px 8px;
        vertical-align: 2px;
        margin-right: 6px;
    }

    .bh-search__result-desc {
        display: block;
        font-size: 0.85rem;
        color: #444;
        line-height: 1.4;
        margin-top: 1px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
</style>
