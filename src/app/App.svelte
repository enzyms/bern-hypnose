<script>
    import ProfileSelection from './ProfileSelection.svelte';
    import TopicSelection from './TopicSelection.svelte';
    import AmbientSelection from './AmbientSelection.svelte';
    import GetReady from './GetReady.svelte';
    import AudioPlayer from './AudioPlayer.svelte';
    import SButton from './SButton.svelte';

    import { currentStep, prevStep } from './store.js';

    let step;

    $: currentStep.subscribe((value) => {
        step = value;
    });
    function handlePlaybackComplete() {
        alert('Session complete!');
    }
</script>

{#if step > 1}
    <SButton className="absolute top-6 left-4" on:click={prevStep}>Back</SButton>
{/if}

<div class="py-20 flex flex-col items-center text-center">
    <div>
        {#if step === 1}
            <ProfileSelection />
        {:else if step === 2}
            <TopicSelection />
        {:else if step === 3}
            <AmbientSelection />
        {:else if step === 4}
            <GetReady />
        {:else if step === 5}
            <AudioPlayer onPlaybackComplete={handlePlaybackComplete} />
        {/if}
    </div>
</div>
