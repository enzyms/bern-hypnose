<script>
    import { onMount, onDestroy } from 'svelte';
    import { selectedProfile, selectedTopic, selectedAmbientSound, ambientSounds } from './store.js';
    import { status, isPlaying, audioPlayer, ambientPlayer, pageTitle } from './store.js';
    import PlayButton from './PlayButton.svelte';
    import CircularProgress from './CircularProgress.svelte';
    import Slider from './Slider.svelte';
    import SButton from './SButton.svelte';
    import Audio from './audio-icon.svelte';
    import CaretIcon from './caret-icon.svelte';
    import NoSleep from '@zakj/no-sleep';

    let duration = 0;
    let currentTime = 0;
    let volume = 0.5;
    let ambientVolume = 0.5;
    let isDrawerOpen = false;
    let noSleep;

    $: currentAudioSource = $selectedProfile && $selectedTopic ? `/audio/${$selectedProfile.id}-${$selectedTopic.id}.mp3` : '';
    $: currentAmbientSource = $selectedAmbientSound ? `/audio/ambient-${$selectedAmbientSound.id}.mp3` : '';

    pageTitle.set(' ');

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

    function handleAmbientSoundChange(event) {
        const selectedId = event.target.value;
        const selectedSound = $ambientSounds.find((sound) => sound.id === selectedId);
        if (selectedSound) {
            selectedAmbientSound.set(selectedSound);
            $ambientPlayer.play();
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

    $: progressValue = duration ? (currentTime / duration) * 100 : 0;
</script>

<audio
    id="audioPlayer"
    bind:this={$audioPlayer}
    bind:duration
    bind:currentTime
    bind:volume
    preload="auto"
    playsinline
    on:canplay={() => ($status = 'can play some')}
    on:canplaythrough={() => ($status = 'can play all')}
    on:waiting={() => ($status = 'waiting')}
    on:timeupdate={() => ($status = 'playing')}
    on:seeking={() => ($status = 'seeking')}
    on:ended={() => {
        $isPlaying = false;
        currentTime = 0;
    }}
    src={currentAudioSource}
/>

<audio
    id="ambientPlayer"
    bind:this={$ambientPlayer}
    bind:volume={ambientVolume}
    preload="auto"
    playsinline
    on:ended={() => {
        $isPlaying = false;
    }}
    src={currentAmbientSource}
/>

<div class="h- relative flex flex-col gap-6 items-center">
    <div>
        <div class="absolute w-[10rem] h-[10rem] pointer-events-none">
            <CircularProgress bind:value={progressValue}></CircularProgress>
        </div>
        <PlayButton on:click={handlePlay} />
    </div>

    <div class="relative w-full">
        <!-- <SButton on:click={() => (isDrawerOpen = !isDrawerOpen)}>
            <Audio class="w-4 h-4" />
        </SButton> -->

        <label
            for="ambientSoundSelect"
            class="inline-flex gap-4 items-center justify-center px-6 py-3 text-base leading-tight font-bold rounded-full transition text-red-600 bg-transparent border border-red-600 hover:bg-red-500 hover:text-red-50"
        >
            <span class="sr-only">Hintergrundgeräusch</span>
            <select
                id="ambientSoundSelect"
                bind:value={$selectedAmbientSound.id}
                on:change={handleAmbientSoundChange}
                class="appearance-none w-full bg-transparent border-none focus:outline-none"
            >
                {#each $ambientSounds as ambientSound}
                    <option value={ambientSound.id}>{ambientSound.name}</option>
                {/each}
            </select>
            <CaretIcon />
        </label>

        <!-- {#if isDrawerOpen}
            <div class="drawer">
                <div class="w-full py-1">
                    <div class="text-sm font-medium pb-4">Lautstärke Stimme</div>
                    <Slider min={0} max={1} step={0.01} precision={2} formatter={(v) => Math.round(v * 100)} bind:value={volume} />
                </div>

                <div class="w-full py-1">
                    <div class="text-sm font-medium pb-4">Lautstärke Hintergrundgeräusch</div>
                    <Slider min={0} max={1} step={0.01} precision={2} formatter={(v) => Math.round(v * 100)} bind:value={ambientVolume} />
                </div>
            </div>
        {/if} -->
    </div>

    <!-- div class="debugger">
        <p><strong>Volume</strong></p>
        <p>{volume}</p>
        <p><strong>Loading</strong></p>
        <p>{$status}</p>
        <p><strong>Playing</strong></p>
        <p>{$isPlaying}</p>
        <p><strong>Time</strong></p>
        <p>{currentTime}</p>
        <p><strong>Duration</strong></p>
        <p>{duration}</p>
    </div-->
</div>

<style>
    audio {
        display: none;
    }

    .drawer {
        position: absolute;
        top: 120%;
        left: 0%;
        right: 0%;
        padding: 1rem;
        z-index: 10;

        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
</style>
