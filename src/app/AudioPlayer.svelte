<script>
    import { onMount, onDestroy } from 'svelte';
    import { selectedProfile, selectedTopic, selectedAmbientSound, ambientSounds, topicsAdult } from './store.js';
    import { status, isPlaying, audioPlayer, ambientPlayer, pageTitle, currentTime, duration } from './store.js';
    import PlayButton from './PlayButton.svelte';
    import CircularProgress from './CircularProgress.svelte';
    import SButton from './SButton.svelte';
    import CaretIcon from './caret-icon.svelte';
    import NoSleep from '@zakj/no-sleep';
    import CircularAudioSeeker from './CircularAudioSeeker.svelte';

    let noSleep;
    let isDrawerOpen = false;

    let localCurrentTime;
    let localDuration;

    $: localCurrentTime = currentTime;
    $: localDuration = duration;

    $: currentAudioSource = $selectedProfile && $selectedTopic ? `/audio/${$selectedProfile.id}-${$selectedTopic.id}.mp3` : '';
    $: currentAmbientSource = $selectedAmbientSound ? `/audio/ambient-${$selectedAmbientSound.id}.mp3` : '';

    pageTitle.set(' ');

    // Update audio position when store changes
    $: if ($audioPlayer && $currentTime !== localCurrentTime && $status === 'seeking') {
        $audioPlayer.currentTime = $currentTime;
    }

    let timeupdate = false;

    async function handlePlay() {
        await enableNoSleep();
        $audioPlayer.play();
        $ambientPlayer.play();
    }

    async function enableNoSleep() {
        try {
            await noSleep.enable();
        } catch (err) {
            console.log('NoSleep enable error:', err);
        }
    }

    async function disableNoSleep() {
        try {
            noSleep.disable();
        } catch (err) {
            console.log('NoSleep disable error:', err);
        }
    }

    function handleAudioTrackChange(event) {
        const selectedId = event.target.value;
        const selectedTrack = topicsAdult.find((topic) => topic.id === selectedId);
        if (selectedTrack) {
            selectedTopic.set(selectedTrack);
            if ($audioPlayer) {
                $audioPlayer.src = `/audio/${$selectedProfile.id}-${selectedTrack.id}.mp3`;
                $audioPlayer.load();
                $audioPlayer.play();
            }
        }
        console.log('Audio track changed:', selectedTrack, $audioPlayer);
    }

    function handleAmbientSoundChange(event) {
        const selectedId = event.target.value;
        const selectedSound = $ambientSounds.find((sound) => sound.id === selectedId);
        if (selectedSound) {
            selectedAmbientSound.set(selectedSound);
            $ambientPlayer.play();
        }
    }

    function handleAudioEnded() {
        $isPlaying = false;
        $status = 'idle';
        currentTime.set(0);
        if ($ambientPlayer) {
            $ambientPlayer.pause();
            $ambientPlayer.currentTime = 0;
        }
    }

    function handleTimeUpdate() {
        if ($status !== 'seeking') {
            currentTime.set(localCurrentTime);
            timeupdate = true;
            // Reset the flag after a tick to trigger the next update
            setTimeout(() => (timeupdate = false), 0);
        }
    }

    onMount(() => {
        noSleep = new NoSleep();
        console.log('NoSleep initialized');

        $audioPlayer.load();
        $ambientPlayer.load();

        document.addEventListener('visibilitychange', async () => {
            if (document.visibilityState === 'visible' && $isPlaying) {
                try {
                    await Promise.all([$audioPlayer.play(), $ambientPlayer.play()]);
                } catch (e) {
                    console.log('Visibility change resume failed:', e);
                }
            }
        });

        console.log('AudioPlayer mounted');
    });

    onDestroy(() => {
        disableNoSleep();
        if ($audioPlayer) {
            $audioPlayer.pause();
            $audioPlayer.currentTime = 0;
        }
        if ($ambientPlayer) {
            $ambientPlayer.pause();
            $ambientPlayer.currentTime = 0;
        }
        $isPlaying = false;
        $status = 'idle';
    });

    $: progressValue = $duration ? ($currentTime / $duration) * 100 : 0;
</script>

<audio
    id="audioPlayer"
    bind:this={$audioPlayer}
    bind:currentTime={localCurrentTime}
    bind:duration={localDuration}
    on:loadedmetadata={() => {
        console.log('Metadata loaded, duration:', localDuration);
        duration.set(localDuration);
    }}
    on:timeupdate={handleTimeUpdate}
    on:canplay={() => {
        console.log('canplay event');
        status.set('can play some');
    }}
    on:canplaythrough={() => {
        console.log('canplaythrough event');
        status.set('can play all');
    }}
    on:waiting={() => {
        console.log('waiting event');
        status.set('waiting');
    }}
    on:seeking={() => {
        console.log('seeking event');
        status.set('seeking');
    }}
    preload="auto"
    playsinline
    on:ended={() => {
        handleAudioEnded();
    }}
    src={currentAudioSource}
/>
<audio
    id="ambientPlayer"
    bind:this={$ambientPlayer}
    preload="auto"
    playsinline
    on:ended={() => {
        $isPlaying = false;
    }}
    src={currentAmbientSource}
/>
<div class="relative flex flex-col gap-8 items-center">
    <div class="relative w-[10rem] h-[10rem]">
        <div class="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
            <CircularProgress bind:value={progressValue}></CircularProgress>
        </div>
        <div class="absolute top-0 left-0 w-full h-full z-0 pointer-events-none">
            <CircularAudioSeeker {audioPlayer} {timeupdate} />
        </div>
        <PlayButton on:click={handlePlay} class="relative z-10" />
    </div>

    <SButton on:click={() => (isDrawerOpen = !isDrawerOpen)} class="relative" aria-label="Toggle Menu" aria-expanded={isDrawerOpen}>
        <span class="text-sm mr-3">Einstellungen</span>
        <span class={`burger-icon ${isDrawerOpen ? 'is-active' : ''}`}>
            <span class="bar" />
        </span>
    </SButton>

    {#if isDrawerOpen}
        <div class="drawer">
            <div class="relative w-full flex flex-col items-start">
                <label for="audioTrackSelect" class="text-sm font-bold ml-6 mb-2">Thema</label>
                <label
                    for="audioTrackSelect"
                    class="w-full flex gap-4 items-center justify-center text-sm leading-tight font-bold rounded-full transition text-red-600 bg-transparent border border-red-600 hover:bg-red-500 hover:text-red-50 relative"
                >
                    <select
                        id="audioTrackSelect"
                        bind:value={$selectedTopic.id}
                        on:change={handleAudioTrackChange}
                        class="px-6 py-3 appearance-none w-full bg-transparent border-none focus:outline-none"
                    >
                        {#each topicsAdult as topic}
                            <option value={topic.id}>{topic.name}</option>
                        {/each}
                    </select>
                    <div class="absolute right-5">
                        <CaretIcon />
                    </div>
                </label>
            </div>

            <div class="relative w-full flex flex-col items-start">
                <label for="ambientSoundSelect" class="text-sm font-bold ml-6 mb-2">Umgebungsmusik</label>
                <label
                    for="ambientSoundSelect"
                    class="w-full flex gap-4 items-center justify-center text-sm leading-tight font-bold rounded-full transition text-red-600 bg-transparent border border-red-600 hover:bg-red-500 hover:text-red-50"
                >
                    <select
                        id="ambientSoundSelect"
                        bind:value={$selectedAmbientSound.id}
                        on:change={handleAmbientSoundChange}
                        class="px-6 py-3 appearance-none w-full bg-transparent border-none focus:outline-none"
                    >
                        {#each $ambientSounds as ambientSound}
                            <option value={ambientSound.id}>{ambientSound.name}</option>
                        {/each}
                    </select>
                    <div class="absolute right-5">
                        <CaretIcon />
                    </div>
                </label>
            </div>
        </div>
    {/if}
</div>

<style>
    audio {
        display: none;
    }

    .drawer {
        position: absolute;
        top: 100%;
        left: 0%;
        right: 0%;
        padding: 2rem;
        z-index: 10;

        display: flex;
        flex-direction: column;
        align-items: start;
        gap: 1rem;
    }

    .menu {
        @apply fixed top-0 left-0 bottom-0 w-full z-40 backdrop-blur-lg transition-all duration-500 ease-in-out;
    }
    .burger-icon {
        @apply w-4 h-4 flex items-center justify-center relative top-[1px];
    }

    .bar {
        @apply w-4 h-[2px] bg-red-600 rounded-full relative transition-all duration-300;
    }

    .bar::before,
    .bar::after {
        content: '';
        @apply w-4 h-[2px] bg-red-600 rounded-full absolute left-0 transition-all duration-300;
    }

    .bar::before {
        transform: translateY(-8px);
    }

    .bar::after {
        transform: translateY(8px);
    }

    /* Active state */
    .is-active .bar {
        @apply bg-transparent;
    }

    .is-active .bar::before {
        transform: rotate(45deg);
    }

    .is-active .bar::after {
        transform: rotate(-45deg);
    }

    :global(button:hover .bar::before),
    :global(button:hover .bar::after) {
        @apply bg-white !important;
    }
    :global(button:hover :not(.is-active) .bar) {
        @apply bg-white !important;
    }
</style>
