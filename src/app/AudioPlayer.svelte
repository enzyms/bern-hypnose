<script>
    import { selectedProfile, selectedTopic, selectedAmbientSound } from './store.js'; // Import stores
    import Slider from './Slider.svelte';
    import { status, isPlaying, audioPlayer, ambientPlayer, pageTitle } from './store.js';
    import { format } from './utilities.js';
    import PlayButton from './PlayButton.svelte';
    import CircularProgress from './CircularProgress.svelte';
    import { onMount, onDestroy } from 'svelte';
    import SButton from './SButton.svelte';
    import Audio from './audio-icon.svelte';

    let duration = 0;
    let currentTime = 0;
    let paused = true;
    let volume = 0.5;
    let ambientVolume = 0.5;

    let slider;
    let rAF = null;

    let isDrawerOpen = false;

    let audioContext;
    let mainGainNode;
    let ambientGainNode;

    $: currentAudioSource = $selectedProfile && $selectedTopic ? `/audio/${$selectedProfile.id}-${$selectedTopic.id}.mp3` : '';
    $: currentAmbientSource = $selectedAmbientSound ? `/audio/ambient-${$selectedAmbientSound.id}.mp3` : '';

    pageTitle.set(' ');

    function whilePlaying() {
        slider.value = audio.currentTime;
        currentTime = slider.value;
        rAF = requestAnimationFrame(whilePlaying);
    }

    function movePosition() {
        time = slider.value;
        if (!audio.paused) {
            cancelAnimationFrame(rAF);
        }
    }

    function updatePosition() {
        audio.currentTime = slider.value;
        if (!audio.paused) {
            requestAnimationFrame(whilePlaying);
        }
    }

    async function initAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            mainGainNode = audioContext.createGain();
            ambientGainNode = audioContext.createGain();

            const mainSource = audioContext.createMediaElementSource($audioPlayer);
            const ambientSource = audioContext.createMediaElementSource($ambientPlayer);

            mainSource.connect(mainGainNode);
            mainGainNode.connect(audioContext.destination);

            ambientSource.connect(ambientGainNode);
            ambientGainNode.connect(audioContext.destination);

            mainGainNode.gain.value = volume;
            ambientGainNode.gain.value = ambientVolume;
        }

        // Resume audio context if it's suspended
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
    }

    // Call this function in your play button handler
    async function handlePlay() {
        await initAudioContext();
        // ... rest of your play logic
    }

    onMount(() => {
        // Initialize Web Audio API
        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Create gain nodes
        mainGainNode = audioContext.createGain();
        ambientGainNode = audioContext.createGain();

        // Connect audio elements to the audio context
        const mainSource = audioContext.createMediaElementSource($audioPlayer);
        const ambientSource = audioContext.createMediaElementSource($ambientPlayer);

        // Connect the audio graph
        mainSource.connect(mainGainNode);
        mainGainNode.connect(audioContext.destination);

        ambientSource.connect(ambientGainNode);
        ambientGainNode.connect(audioContext.destination);

        // Set initial volumes
        mainGainNode.gain.value = volume;
        ambientGainNode.gain.value = ambientVolume;

        $audioPlayer.load();
        $ambientPlayer.load();
    });

    onDestroy(() => {
        // Reset audio states
        if ($audioPlayer) {
            $audioPlayer.pause();
            $audioPlayer.currentTime = 0;
        }
        if ($ambientPlayer) {
            $ambientPlayer.pause();
            $ambientPlayer.currentTime = 0;
        }
        $isPlaying = false;
        $status = 'idle'; // Add this status to your store

        if (audioContext) {
            audioContext.close();
        }
    });

    // Update gain nodes when volume changes
    $: if (mainGainNode) mainGainNode.gain.value = volume;
    $: if (ambientGainNode) ambientGainNode.gain.value = ambientVolume;

    $: progressValue = duration ? (currentTime / duration) * 100 : 0;
</script>

<audio
    id="audioPlayer"
    bind:this={$audioPlayer}
    bind:duration
    bind:currentTime
    bind:paused
    bind:volume
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
    bind:paused
    bind:volume={ambientVolume}
    on:ended={() => {
        $isPlaying = false;
        currentTime = 0;
    }}
    src={currentAmbientSource}
/>

<div class="h-[65dvh] relative flex flex-col gap-8 items-center justify-center">
    <div>
        <div class="absolute w-[10rem] h-[10rem] pointer-events-none">
            <CircularProgress bind:value={progressValue}></CircularProgress>
        </div>
        <PlayButton />
    </div>

    <div class="relative w-full">
        <SButton on:click={() => (isDrawerOpen = !isDrawerOpen)}>
            <Audio class="w-4 h-4" />
        </SButton>

        {#if isDrawerOpen}
            <div class="drawer">
                <div class="volume-slider mb-6">
                    <div class="text-sm font-bold mb-2">Volume</div>
                    <Slider min={0} max={1} step={0.01} precision={2} formatter={(v) => Math.round(v * 100)} bind:value={volume} />
                </div>

                <div class="volume-slider mb-6">
                    <div class="text-sm font-bold mb-2">AmbientVolume</div>
                    <Slider min={0} max={1} step={0.01} precision={2} formatter={(v) => Math.round(v * 100)} bind:value={ambientVolume} />
                </div>
            </div>
        {/if}
    </div>

    <!-- TODO maybe: add progress controller into a drawer? 
    <div class="fixed top-0 z-[200] left-0 right-0 border-t border-gray-200">
        <div class="progress-slider">
            <Slider
                bind:this={slider}
                min={0}
                bind:value={currentTime}
                max={duration}
                step={0.01}
                precision={2}
                formatter={(v) => format(v)}
                on:input={movePosition}
                on:change={updatePosition}
            />
        </div>
    </div>
    -->

    <!-- 	<div class='debugger'> -->

    <!-- 		<p><strong>Index</strong></p><p>{$index}</p> -->
    <!-- 		<p><strong>Volume</strong></p><p>{volume}</p> -->
    <!-- 		<p><strong>Loading</strong></p><p>{$status}</p> -->
    <!-- 		<p><strong>Playing</strong></p><p>{$isPlaying}</p> -->
    <!-- 		<p><strong>Time</strong></p><p>{currentTime}</p> -->
    <!-- 		<p><strong>Duration</strong></p><p>{duration}</p> -->

    <!-- 	</div> -->
</div>

<style>
    audio {
        display: none;
    }

    .volume-slider {
        margin: 0;
        padding: 0;
        width: 100%;
    }

    .drawer {
        position: absolute;
        top: 120%;
        left: 0%;
        right: 0%;
        padding: 1rem 0;
        z-index: 10;

        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    /* 	.debugger {
		padding: 1rem;
		place-items: center;
		column-gap: 1rem;
		border: 1px solid #bbb;
		border-radius: 8px;
		background: #ddd;
		grid-template-columns: 4rem 1fr 4rem 1fr;
		justify-items: start;
		align-items: center;
		row-gap: 0.5rem;
	} */
</style>
