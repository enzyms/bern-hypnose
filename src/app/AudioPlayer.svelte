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

    let wakeLock = null;

    let mainSource;
    let ambientSource;

    let noSleepVideo;

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

    function createNoSleepVideo() {
        if (!noSleepVideo) {
            noSleepVideo = document.createElement('video');
            noSleepVideo.setAttribute('playsinline', '');
            noSleepVideo.setAttribute('webkit-playsinline', '');
            noSleepVideo.setAttribute('loop', '');
            noSleepVideo.setAttribute('muted', '');
            noSleepVideo.setAttribute('title', 'no-sleep');
            noSleepVideo.style.display = 'none';

            const source = document.createElement('source');
            source.src =
                'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAu1tZGF0AAACrQYF//+p3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE1NSByMjkyMSA3ZDBlYjRiIC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxOCAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTEgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTEwIHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAAD2WIhAA3//728P4FNjuZQQAAAu5tb292AAAAbG12aGQAAAAAAAAAAAAAAAAAAAPoAAAAZAABAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACGHRyYWsAAABcdGtoZAAAAAMAAAAAAAAAAAAAAAEAAAAAAAAAZAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAgAAAAIAAAAAACRlZHRzAAAAHGVsc3QAAAAAAAAAAQAAAGQAAAAAAAEAAAAAAZBtZGlhAAAAIG1kaGQAAAAAAAAAAAAAAAAAACgAAAAEAFXEAAAAAAAtaGRscgAAAAAAAAAAdmlkZQAAAAAAAAAAAAAAAFZpZGVvSGFuZGxlcgAAAAE7bWluZgAAABR2bWhkAAAAAQAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAAA+3N0YmwAAACXc3RzZAAAAAAAAAABAAAAh2F2YzEAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAgACAEgAAABIAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY//8AAAAxYXZjQwFkAAr/4QAYZ2QACqzZX4iIhAAAAwAEAAADAFA8SJZYAQAGaOvjyyLAAAAAGHN0dHMAAAAAAAAAAQAAAAEAAAQAAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAABAAAAAQAAABRzdHN6AAAAAAAAAsUAAAABAAAAFHN0Y28AAAAAAAAAAQAAADAAAABidWR0YQAAAFptZXRhAAAAAAAAACFoZGxyAAAAAAAAAABtZGlyYXBwbAAAAAAAAAAAAAAAAC1pbHN0AAAAJal0b28AAAAdZGF0YQAAAAEAAAAATGF2ZjU4LjI5LjEwMA==';
            noSleepVideo.appendChild(source);
            document.body.appendChild(noSleepVideo);
        }
    }

    async function enableNoSleep() {
        createNoSleepVideo();

        try {
            // Try multiple wake lock strategies
            if ('wakeLock' in navigator) {
                wakeLock = await navigator.wakeLock.request('screen');
            }

            if (noSleepVideo) {
                await noSleepVideo.play();
            }

            // iOS specific audio session configuration
            if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                await audioContext.resume();
                $audioPlayer.setAttribute('webkit-playsinline', '');
                $ambientPlayer.setAttribute('webkit-playsinline', '');

                // Request audio focus (iOS 13+)
                if ('audioSession' in navigator) {
                    try {
                        // @ts-ignore - iOS specific API
                        await navigator.audioSession.requestPermission();
                    } catch (e) {
                        console.log('Audio session permission error:', e);
                    }
                }
            }
        } catch (err) {
            console.log('No sleep enable error:', err);
        }
    }

    async function disableNoSleep() {
        try {
            if (wakeLock) {
                await wakeLock.release();
                wakeLock = null;
            }
            if (noSleepVideo) {
                noSleepVideo.pause();
            }
        } catch (err) {
            console.log('No sleep disable error:', err);
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
        // Pre-initialize audio elements
        $audioPlayer.load();
        $ambientPlayer.load();

        // Set up audio elements
        $audioPlayer.setAttribute('playsinline', '');
        $audioPlayer.setAttribute('webkit-playsinline', '');
        $ambientPlayer.setAttribute('playsinline', '');
        $ambientPlayer.setAttribute('webkit-playsinline', '');

        // Listen for initialization request from play button
        document.addEventListener('initAudio', async () => {
            await initAudioContext();
        });

        if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            await setupIOSAudio();
        }

        // Initialize audio on first user interaction
        const initOnInteraction = async () => {
            await initAudioContext();
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
        if (noSleepVideo && document.body.contains(noSleepVideo)) {
            document.body.removeChild(noSleepVideo);
        }
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
