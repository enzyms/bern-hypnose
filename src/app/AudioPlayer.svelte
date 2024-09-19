<script>
    import { selectedProfile, selectedTopic, selectedAmbientSound } from './store.js'; // Import stores
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

    let audioFiles = [];
    let ambientFile;
    let currentAudioIndex = 0;
    let audioElement;
    let ambientElement;

    let isPlaying = false; // Track play/pause state

    // Function to get audio files based on the profile and topic
    $: if (profile && topic) {
        audioFiles = getAudioFiles(profile, topic);
        ambientFile = getAmbientFile(ambient);
        currentAudioIndex = 0; // Reset index when profile or topic changes
    }

    function getAudioFiles(profile, topic) {
        return [`/audio/${profile.id}-${topic.id}-intro.mp3`, `/audio/${profile.id}-${topic.id}-session.mp3`, `/audio/${profile.id}-${topic.id}-outro.mp3`];
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
        if (currentAudioIndex < audioFiles.length) {
            audioElement.src = audioFiles[currentAudioIndex]; // Set the audio source to the current file
            try {
                await audioElement.play(); // Play the audio file and handle promise
                isPlaying = true; // Set playing state to true
            } catch (error) {
                console.error('Error playing audio:', error); // Handle play error
            }
        } else if (onPlaybackComplete) {
            onPlaybackComplete(); // Trigger playback complete action if all files are done
        }
    }

    async function playAmbient() {
        if (currentAudioIndex < audioFiles.length) {
            //TO DO:  THIS HAS TO BE CHECK
            ambientElement.src = ambientFile; // Set the audio source to the current file
            try {
                await ambientElement.play(); // Play the audio file and handle promise
                isPlaying = true; // Set playing state to true
            } catch (error) {
                console.error('Error playing audio:', error); // Handle play error
            }
        }
    }

    // Function to play the next audio file after the current one ends
    function playNext() {
        if (currentAudioIndex < audioFiles.length - 1) {
            currentAudioIndex++; // Move to the next audio in the list
            playCurrent(); // Play the next audio
        } else if (onPlaybackComplete) {
            onPlaybackComplete(); // Complete the playback if all files have been played
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
            ambientElement.pause();
            isPlaying = false; // Set playing state to false
        } else {
            playCurrent(); // Start or resume playback from the current file
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
</script>

<audio bind:this={audioElement} on:ended={onEnded} on:play={onPlay} on:pause={onPause}> </audio>

<audio bind:this={ambientElement} on:play={onPlay} on:pause={onPause} loop> </audio>

<!-- Play/Pause Button -->
<button on:click={togglePlayPause}>
    {#if isPlaying}
        ⏸ Pause
    {:else}
        ▶️ Play
    {/if}
</button>
