<script>
    import { selectedProfile, selectedTopic, selectedAmbientSound } from './store.js'; // Import stores
    import Slider from './Slider.svelte';
    import { status, isPlaying, audioPlayer, ambientPlayer, pageTitle } from './store.js';
    import { format } from './utilities.js';
    import PlayButton from './PlayButton.svelte';
    import { onMount } from 'svelte';

    let duration = 0;
    let currentTime = 0;
    let paused = true;
    let volume = 0.5;
    let ambientVolume = 0.08;

    let slider;
    let rAF = null;

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

    onMount(() => {
        $audioPlayer.load();
        $ambientPlayer.load();
    });
</script>

<audio
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
    bind:this={$ambientPlayer}
    bind:paused
    bind:volume={ambientVolume}
    on:ended={() => {
        $isPlaying = false;
        currentTime = 0;
    }}
    src={currentAmbientSource}
/>

<div class="box">
    <PlayButton />

    <div class="volume-slider mb-6">
        <strong>Volume</strong>
        <Slider min={0} max={1} step={0.01} precision={2} formatter={(v) => Math.round(v * 100)} bind:value={volume} />
    </div>

    <div class="volume-slider mb-6">
        <strong>AmbientVolume</strong>
        <Slider min={0} max={0.12} step={0.01} precision={3} formatter={(v) => Math.round(v * 100)} bind:value={ambientVolume} />
    </div>

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

    div {
        display: grid;
        grid-auto-flow: row;
    }

    button {
        margin: 0;
        padding: 0;
        width: 4rem;
        height: 2rem;
        border-radius: 4px;
        border: 1px solid #bbb;
        background: #fcfcfc;
    }

    p {
        margin: 0;
        padding: 0;
        line-height: 1;
        user-select: none;
    }

    strong {
        margin: 0;
        padding: 0;
        font-size: 14px;
        line-height: 1;
    }

    span {
        display: inline-grid;
        margin: 0;
        padding: 0.25rem 0.75rem;
        width: 2.5rem;
        background: #f3f3f3;
        border: 1px solid #bbb;
        border-radius: 6px;
        place-items: center;
        font-size: 14px;
    }

    .box {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
    }

    .info {
        margin: 0;
        padding: 0;
        width: 100%;
        grid-template-columns: 1fr;
        grid-template-rows: 2;
        justify-items: start;
        row-gap: 0.75rem;
    }

    .buttons {
        grid-template-columns: 4rem 4rem 4rem 4rem 1fr;
        place-items: center;
        column-gap: 1rem;
    }

    .volume-slider {
        margin: 0;
        padding: 0;
        width: 100%;
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
