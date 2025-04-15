<script>
    import { onMount, onDestroy } from 'svelte';
    import { selectedProfile, selectedTopic, selectedAmbientSound } from './store.js';
    import Slider from './Slider.svelte';
    import { status, isPlaying, audioPlayer, ambientPlayer, pageTitle } from './store.js';
    import { format } from './utilities.js';
    import PlayButton from './PlayButton.svelte';
    import CircularProgress from './CircularProgress.svelte';
    import SButton from './SButton.svelte';
    import Audio from './audio-icon.svelte';
    import NoSleep from '@zakj/no-sleep';

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

    let wakeLock = null;

    let mainSource;
    let ambientSource;

    let noSleep;

    $: currentAudioSource = $selectedProfile && $selectedTopic ? `/audio/${$selectedProfile.id}-${$selectedTopic.id}.mp3` : '';
    $: currentAmbientSource = $selectedAmbientSound ? `/audio/ambient-${$selectedAmbientSound.id}.mp3` : '';

    pageTitle.set(' ');

    function whilePlaying() {
        if (currentTime >= duration) {
            cancelAnimationFrame(rAF);
            $isPlaying = false;
            currentTime = 0;
            return;
        }

        slider.value = Math.min(audio.currentTime, duration);
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

    async function enableNoSleep() {
        try {
            await noSleep.enable();
            console.log('NoSleep enabled');
        } catch (err) {
            console.log('NoSleep enable error:', err);
        }
    }

    async function disableNoSleep() {
        try {
            noSleep.disable();
            console.log('NoSleep disabled');
        } catch (err) {
            console.log('NoSleep disable error:', err);
        }
    }

    async function initAudioContext() {
        if (!audioContext) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContext = new AudioContext({
                latencyHint: 'playback',
                sampleRate: 44100
            });

            // Initialize gain nodes
            mainGainNode = audioContext.createGain();
            ambientGainNode = audioContext.createGain();

            try {
                const mainSource = audioContext.createMediaElementSource($audioPlayer);
                const ambientSource = audioContext.createMediaElementSource($ambientPlayer);

                mainSource.connect(mainGainNode);
                mainGainNode.connect(audioContext.destination);

                ambientSource.connect(ambientGainNode);
                ambientGainNode.connect(audioContext.destination);

                mainGainNode.gain.value = volume;
                ambientGainNode.gain.value = ambientVolume;

                // For iOS, we need to resume the context immediately
                if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                }

                return true;
            } catch (error) {
                console.error('Audio initialization error:', error);
                return false;
            }
        }
        return true;
    }

    async function handlePlay() {
        await initAudioContext();
        await enableNoSleep();
        // ... rest of your play logic
    }

    // iOS Audio Session setup
    async function setupIOSAudio() {
        // Create and play a silent audio buffer to keep audio session active
        const silentAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        const buffer = silentAudioContext.createBuffer(1, 1, 22050);
        const source = silentAudioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(silentAudioContext.destination);
        source.start();

        // Configure audio elements for iOS
        $audioPlayer.setAttribute('playsinline', '');
        $audioPlayer.setAttribute('webkit-playsinline', '');
        $ambientPlayer.setAttribute('playsinline', '');
        $ambientPlayer.setAttribute('webkit-playsinline', '');

        // Set audio to play in background
        $audioPlayer.setAttribute('x-webkit-airplay', 'allow');
        $ambientPlayer.setAttribute('x-webkit-airplay', 'allow');
    }

    onMount(async () => {
        noSleep = new NoSleep();
        console.log('NoSleep initialized');

        // Pre-initialize audio elements
        $audioPlayer.load();
        $ambientPlayer.load();

        // Set up audio elements
        $audioPlayer.setAttribute('playsinline', '');
        $audioPlayer.setAttribute('webkit-playsinline', '');
        $ambientPlayer.setAttribute('playsinline', '');
        $ambientPlayer.setAttribute('webkit-playsinline', '');

        if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            await setupIOSAudio();
        }

        // Initialize audio on first user interaction
        const initOnInteraction = async () => {
            await initAudioContext();
            await enableNoSleep();
            document.removeEventListener('touchstart', initOnInteraction);
            document.removeEventListener('click', initOnInteraction);
        };

        document.addEventListener('touchstart', initOnInteraction, false);
        document.addEventListener('click', initOnInteraction, false);

        // Handle audio interruptions
        $audioPlayer.addEventListener('pause', async () => {
            if ($isPlaying) {
                try {
                    await $audioPlayer.play();
                } catch (e) {
                    console.log('Auto-resume failed:', e);
                }
            }
        });

        $ambientPlayer.addEventListener('pause', async () => {
            if ($isPlaying) {
                try {
                    await $ambientPlayer.play();
                } catch (e) {
                    console.log('Auto-resume failed:', e);
                }
            }
        });

        // Handle page visibility changes
        document.addEventListener('visibilitychange', async () => {
            if (document.visibilityState === 'visible' && $isPlaying) {
                try {
                    await Promise.all([$audioPlayer.play(), $ambientPlayer.play()]);
                } catch (e) {
                    console.log('Visibility change resume failed:', e);
                }
            }
        });
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
    preload="auto"
    playsinline
    webkit-playsinline
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
    preload="auto"
    playsinline
    webkit-playsinline
    on:ended={() => {
        $isPlaying = false;
        currentTime = 0;
    }}
    src={currentAmbientSource}
/>

<div class="h-[65dvh] relative flex flex-col gap-6 items-center justify-center">
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
                <div class="w-full py-1">
                    <div class="text-sm font-medium pb-4">Lautstärke Stimme</div>
                    <Slider min={0} max={1} step={0.01} precision={2} formatter={(v) => Math.round(v * 100)} bind:value={volume} />
                </div>

                <div class="w-full py-1">
                    <div class="text-sm font-medium pb-4">Lautstärke Hintergrundgeräusch</div>
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

<!-- Add these meta tags to your Astro layout file -->
<!-- 
<head>
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black">
    <meta name="apple-mobile-web-app-title" content="Your App Name">
</head>
-->

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
