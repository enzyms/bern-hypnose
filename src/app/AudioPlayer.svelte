<script>
    import { selectedProfile, selectedTopic, selectedAmbientSound } from './store.js'; // Import stores
    import CircleProgressBar from './CircleProgressBar.svelte';

    export let onPlaybackComplete; // Optional callback when playback completes

    let profile;
    let topic;
    let ambient;

    // Subscribe to the stores to get selected profile and topic
    $: selectedProfile.subscribe((value) => {
        profile = value;
    });
    $: selectedTopic.subscribe((value) => {
        topic = value;
    });
    $: selectedAmbientSound.subscribe((value) => {
        ambient = value;
    });

    let audioFile;
    let ambientFile;
    let audioElement;
    let ambientElement;

    let isPlaying = false; // Track play/pause state

    let currentTime = 0;
    let duration = 0;

    // Calculate progress in degrees (0-360) based on current time and duration
    $: progress = duration > 0 ? currentTime / duration : 0;

    // Function to get audio files based on the profile and topic
    $: if (profile && topic) {
        audioFile = getAudioFile(profile, topic);
        ambientFile = getAmbientFile(ambient);
        if (audioElement) {
            audioElement.src = audioFile; // Set the audio source when profile/topic changes
        }
    }

    function getAudioFile(profile, topic) {
        return `/audio/${profile.id}-${topic.id}.mp3`;
    }
    function getAmbientFile(ambient) {
        if (ambient !== 'none') {
            return `/audio/ambient-${ambient}.mp3`;
        } else {
            return undefined;
        }
    }

    // Function to play the current audio in the sequence
    async function playCurrent() {
        audioElement.src = audioFile; // Set the audio source to the file
        try {
            await audioElement.play();
            isPlaying = true;
            console.log('audioElement', audioElement);
        } catch (error) {
            console.error('Error playing audio:', error);
        }
    }

    async function playAmbient() {
        if (ambientFile) {
            // Only check if we have an ambient file
            ambientElement.src = ambientFile;
            try {
                await ambientElement.play();
                ambientElement.volume = 0.05;
                isPlaying = true;
            } catch (error) {
                console.error('Error playing audio:', error);
            }
        }
    }

    // Function to play the next audio file after the current one ends
    function playNext() {
        if (onPlaybackComplete) {
            onPlaybackComplete();
            ambientElement.pause();
        }
    }

    // Move to the next audio file after the current one ends
    function onEnded() {
        playNext();
    }

    // Toggle between play and pause
    async function togglePlayPause() {
        if (isPlaying) {
            audioElement.pause(); // Pause the audio
            ambientElement.pause(); // This line is already pausing the ambient sound
            isPlaying = false; // Set playing state to false
        } else {
            // No need to set src again, just resume from current position
            audioElement.play(); // Resume playback from current position
            playAmbient();
        }
    }

    // Update play state when audio starts playing
    function onPlay() {
        isPlaying = true; // Set the playing state to true
    }

    // Update play state when audio is paused
    function onPause() {
        isPlaying = false; // Set playing state to false when paused
    }

    // Format time in MM:SS
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Handle seeking when user drags the slider
    function handleSeek() {
        audioElement.currentTime = currentTime;
    }

    // Update currentTime when timeupdate event fires
    function onTimeUpdate() {
        currentTime = audioElement.currentTime;
        duration = audioElement.duration;
    }
</script>

<audio bind:this={audioElement} on:ended={onEnded} on:play={onPlay} on:pause={onPause} on:timeupdate={onTimeUpdate}> </audio>

<audio bind:this={ambientElement} on:play={onPlay} on:pause={onPause} loop volume="0.5"> </audio>

<!-- Play/Pause Button -->
<button on:click={togglePlayPause}>
    {#if isPlaying}
        ⏸ Pause
    {:else}
        ▶️ Play
    {/if}
</button>

<!-- Volume Slider for Ambient Sound -->
{#if ambient && ambient !== 'none' && ambientElement}
    <div class="volume-control">
        <label for="ambient-volume">Ambient Volume:</label>
        <input type="range" id="ambient-volume" min="0" max="0.25" step="0.02" bind:value={ambientElement.volume} />
    </div>
{/if}

<!-- Progress Slider -->
{#if duration > 0}
    <div class="progress-control">
        <span>{formatTime(currentTime)}</span>
        <input type="range" min="0" max={duration} step="0.1" bind:value={currentTime} on:change={handleSeek} />
        <span>{formatTime(duration)}</span>
    </div>
{/if}

<CircleProgressBar {progress} />

<style>
    .volume-control {
        margin-top: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .progress-control {
        margin: 1rem 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .progress-control input[type='range'] {
        flex: 1;
    }
</style>
