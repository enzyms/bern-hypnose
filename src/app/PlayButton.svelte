<script>
    import { status, isPlaying, audioPlayer, ambientPlayer } from './store.js';
    import PlayIcon from './play-icon.svelte';
    import PauseIcon from './pause-icon.svelte';
    import LoadingIcon from './loading-icon.svelte';

    async function playTrack() {
        try {
            // Force user interaction for iOS
            await document.body.click();

            // Create a promise for each audio play attempt
            const playPromises = [
                $audioPlayer.play().catch((err) => {
                    console.log('Audio play failed:', err);
                    return Promise.reject(err);
                }),
                $ambientPlayer.play().catch((err) => {
                    console.log('Ambient play failed:', err);
                    return Promise.reject(err);
                })
            ];

            // Wait for both to complete
            await Promise.all(playPromises);
            $isPlaying = true;
        } catch (error) {
            console.error('Error playing audio:', error);
            $isPlaying = false;
            // Try to recover
            $audioPlayer.currentTime = 0;
            $ambientPlayer.currentTime = 0;
        }
    }

    function pauseTrack() {
        try {
            $audioPlayer.pause();
            $ambientPlayer.pause();
        } catch (err) {
            console.error('Error pausing:', err);
        } finally {
            $isPlaying = false;
        }
    }
</script>

{#if $isPlaying === false}
    <button class="play-button" on:click={playTrack}>
        <PlayIcon size="5" />
    </button>
{:else if $isPlaying === true && ($status === 'waiting' || $status === 'loading' || $status === 'can play some' || $status === 'can play all')}
    <button class="play-button" on:click={pauseTrack}>
        <LoadingIcon size="5" />
    </button>
{:else if $isPlaying === true}
    <button class="play-button" on:click={pauseTrack}>
        <PauseIcon size="5" />
    </button>
{/if}

<style lang="postcss">
    .play-button {
        margin: 0;
        padding: 0;
        width: 10rem;
        height: 10rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        border: 1px solid #bbb;

        @apply border border-red-600 text-red-600;
    }
</style>
