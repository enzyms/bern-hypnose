<script lang="ts">
    import { onMount } from 'svelte';
    import { fly } from 'svelte/transition';
    import { marked } from 'marked';

    marked.setOptions({ breaks: true, gfm: true });

    const EMBED_ID = '090e1c03-3e1e-4e42-a9a5-9a193c659591';
    const API_BASE = 'https://chat.bern-hypnose.ch/api/embed';
    const SESSION_KEY = 'bh-chat-session';

    type Message = { role: 'user' | 'assistant'; content: string };

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
    });

    let shouldAutoScroll = $state(true);

    function isNearBottom() {
        if (!messagesEl) return true;
        const { scrollTop, scrollHeight, clientHeight } = messagesEl;
        return scrollHeight - scrollTop - clientHeight < 80;
    }

    function scrollToBottom() {
        if (!messagesEl) return;
        messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: 'smooth' });
    }

    function handleScroll() {
        if (!isStreaming) return;
        shouldAutoScroll = isNearBottom();
    }

    // Auto-scroll reactively when assistant content changes during streaming
    $effect(() => {
        if (!isStreaming || !messages.length) return;
        // Access the last message content to track it reactively
        const last = messages[messages.length - 1];
        if (last?.role === 'assistant') last.content;
        if (shouldAutoScroll) {
            requestAnimationFrame(() => scrollToBottom());
        }
    });

    async function sendMessage(text: string) {
        const trimmed = text.trim();
        if (!trimmed || isStreaming) return;

        inputValue = '';
        messages.push({ role: 'user', content: trimmed });
        messages.push({ role: 'assistant', content: '' });
        const lastIdx = messages.length - 1;
        isStreaming = true;
        shouldAutoScroll = true;
        scrollToBottom();

        try {
            const res = await fetch(`${API_BASE}/${EMBED_ID}/stream-chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: trimmed, sessionId })
            });

            if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

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
                        if (data.textResponse) {
                            messages[lastIdx].content += data.textResponse;
                            scrollToBottom();
                        }
                    } catch {
                        /* ignore partial JSON lines */
                    }
                }
            }
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
</script>

<div class="bh-chat">
    {#if isOpen}
        <div class="bh-chat__panel" transition:fly={{ y: 16, duration: 250 }}>
            <!-- Header -->
            <div class="bh-chat__header">
                <div class="bh-chat__header-actions">
                    <button class="bh-chat__icon-btn" onclick={resetChat} title="Gespräch zurücksetzen">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                        </svg>
                    </button>
                    <button class="bh-chat__icon-btn" onclick={() => (isOpen = false)} title="Schließen">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Messages -->
            <div class="bh-chat__messages" bind:this={messagesEl}>
                {#if messages.length === 0}
                    <div class="bh-chat__greeting">
                        <p>Hallo! Ich bin Janines virtuelle Assistentin. Ich beantworte gerne deine Fragen zur Hypnosetherapie.</p>
                        <div class="bh-chat__suggestions">
                            {#each SUGGESTED as q}
                                <button class="bh-chat__suggestion" onclick={() => sendMessage(q)}>{q}</button>
                            {/each}
                        </div>
                    </div>
                {:else}
                    {#each messages as msg}
                        <div class="bh-chat__msg bh-chat__msg--{msg.role}">
                            {#if msg.role === 'assistant' && msg.content === '' && isStreaming}
                                <span class="bh-chat__typing"><span></span><span></span><span></span></span>
                            {:else if msg.role === 'assistant'}
                                {@html marked.parse(msg.content)}
                            {:else}
                                {msg.content}
                            {/if}
                        </div>
                    {/each}
                {/if}
            </div>

            <!-- Input -->
            <div class="bh-chat__input-bar">
                <input
                    class="bh-chat__input"
                    type="text"
                    placeholder="Deine Frage..."
                    bind:value={inputValue}
                    onkeydown={handleKeydown}
                    disabled={isStreaming}
                />
                <button class="bh-chat__send" onclick={() => sendMessage(inputValue)} disabled={isStreaming || !inputValue.trim()} aria-label="Senden">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="m22 2-7 20-4-9-9-4 20-7z" />
                        <path d="M22 2 11 13" />
                    </svg>
                </button>
            </div>
        </div>
    {/if}

    <!-- Bubble -->
    <button class="bh-chat__bubble" onclick={() => (isOpen = !isOpen)} aria-label={isOpen ? 'Chat schließen' : 'Chat öffnen'}>
        {#if isOpen}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M18 6 6 18M6 6l12 12" />
            </svg>
        {:else}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
        {/if}
    </button>
</div>

<style>
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
        background: #f7f0f850;
    }

    /* Panel */
    .bh-chat__panel {
        width: min(580px, calc(100vw - 40px));
        height: min(760px, 90svh);
        background: #f7f0f8;
        border-radius: 16px;
        box-shadow: 0 8px 40px rgba(0, 0, 0, 0.18);
        display: flex;
        flex-direction: column;
        overflow: hidden;
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

    .bh-chat__avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        flex-shrink: 0;
    }

    .bh-chat__name {
        font-weight: 600;
        margin: 0;
    }

    .bh-chat__online {
        opacity: 0.85;
        margin: 0;
    }

    .bh-chat__header-actions {
        display: flex;
        justify-content: flex-end;
        gap: 4px;
    }

    .bh-chat__icon-btn {
        background: #dc2626;
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
        background: #ef4444;
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
        scroll-behavior: smooth;
    }

    .bh-chat__greeting {
        display: flex;
        flex-direction: column;
        gap: 20px;
        color: #333;
    }

    .bh-chat__greeting p {
        margin: 0;
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
        line-height: 1.4;
        transition:
            background 0.15s,
            border-color 0.15s;
        font-family: inherit;
    }
    .bh-chat__suggestion:hover {
        background: #ead7eb;
    }

    .bh-chat__msg {
        max-width: 90%;
        padding: 12px 14px;
        border-radius: 14px;
        line-height: 1.5;
        word-break: break-word;
    }

    .bh-chat__msg--user {
        white-space: pre-wrap;
    }

    .bh-chat__msg--user {
        align-self: flex-end;
        background: #e9d7eb;
        color: #0b0b0b;
        border-bottom-right-radius: 4px;
    }

    .bh-chat__msg--assistant {
        align-self: flex-start;
        color: #0b0b0b;
        border-bottom-left-radius: 4px;
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
        color: #9b4dca;
        text-decoration: underline;
        text-underline-offset: 2px;
    }
    .bh-chat__msg--assistant :global(a:hover) {
        color: #7b2fa8;
    }
    .bh-chat__msg--assistant :global(ul),
    .bh-chat__msg--assistant :global(ol) {
        margin: 0.4em 0;
        padding-left: 1.4em;
    }
    .bh-chat__msg--assistant :global(li) {
        margin-bottom: 0.2em;
    }
    .bh-chat__msg--assistant :global(code) {
        background: rgba(0, 0, 0, 0.06);
        padding: 0.15em 0.35em;
        border-radius: 4px;
        font-size: 0.9em;
    }
    .bh-chat__msg--assistant :global(blockquote) {
        border-left: 3px solid #d4a8e0;
        margin: 0.4em 0;
        padding: 0.2em 0.8em;
        color: #555;
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
        border-color: #ef4444;
    }
    .bh-chat__input:disabled {
        opacity: 0.6;
    }

    .bh-chat__send {
        background: #ef4444;
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
        background: #dc2626;
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
        background: #ef4444;
        border: none;
        color: #fff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 18px rgba(239, 68, 68, 0.45);
        transition:
            transform 0.2s,
            box-shadow 0.2s;
        flex-shrink: 0;
    }
    .bh-chat__bubble:hover {
        transform: scale(1.06);
        box-shadow: 0 6px 24px rgba(239, 68, 68, 0.55);
    }
</style>
