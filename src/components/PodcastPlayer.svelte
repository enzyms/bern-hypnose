<script module lang="ts">
    // Only one episode plays at a time across all players on the page.
    let playing: HTMLAudioElement | null = null;
</script>

<script lang="ts">
    import { onMount } from 'svelte';

    type Props = {
        src: string;
        title: string;
        duration: number; // seconds, from frontmatter; refined once metadata loads
    };

    let { src, title, duration }: Props = $props();

    let audio: HTMLAudioElement | undefined = $state();
    let enhanced = $state(false); // false = native <audio controls> (SSR / no JS)
    let paused = $state(true);
    let currentTime = $state(0);
    let mediaDuration = $state(0);

    // Same-origin path so the player works on localhost, deploy previews and production.
    const playableSrc = src.startsWith('http') ? new URL(src).pathname : src;
    const total = $derived(mediaDuration > 0 && Number.isFinite(mediaDuration) ? mediaDuration : duration);

    onMount(() => {
        enhanced = true;
        return () => {
            if (playing === audio) playing = null;
        };
    });

    function format(seconds: number): string {
        const s = Math.max(0, Math.floor(seconds));
        return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    }

    function toggle() {
        if (!audio) return;
        if (audio.paused) audio.play();
        else audio.pause();
    }

    function onPlay() {
        if (playing && playing !== audio) playing.pause();
        playing = audio ?? null;
    }

    function seek(event: Event) {
        if (!audio) return;
        audio.currentTime = Number((event.currentTarget as HTMLInputElement).value);
    }
</script>

<div class="podcast-player not-prose rounded-xl bg-white/30 dark:bg-white/10 p-4 shadow-sm">
    <audio
        bind:this={audio}
        bind:paused
        bind:currentTime
        bind:duration={mediaDuration}
        onplay={onPlay}
        src={playableSrc}
        preload="none"
        controls={!enhanced}
        class={enhanced ? 'hidden' : 'w-full'}
    >
        <a href={playableSrc}>{title} herunterladen</a>
    </audio>

    {#if enhanced}
        <div class="flex items-center gap-4">
            <button
                type="button"
                onclick={toggle}
                aria-label={paused ? `${title} abspielen` : `${title} pausieren`}
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-500 text-white transition hover:bg-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
                {#if paused}
                    <svg viewBox="0 0 24 24" class="ml-0.5 h-5 w-5 fill-current" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                {:else}
                    <svg viewBox="0 0 24 24" class="h-5 w-5 fill-current" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
                {/if}
            </button>
            <div class="flex min-w-0 flex-1 flex-col gap-1">
                <input
                    type="range"
                    min="0"
                    max={Math.ceil(total)}
                    step="1"
                    value={currentTime}
                    oninput={seek}
                    aria-label="Position in der Folge"
                    aria-valuetext={`${format(currentTime)} von ${format(total)}`}
                    class="w-full accent-red-500"
                />
                <div class="flex justify-between text-xs tabular-nums opacity-70">
                    <span>{format(currentTime)}</span>
                    <span>{format(total)}</span>
                </div>
            </div>
        </div>
    {/if}
</div>
