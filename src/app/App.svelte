<script>
    import ProfileSelection from './ProfileSelection.svelte';
    import TopicSelection from './TopicSelection.svelte';
    import AmbientSelection from './AmbientSelection.svelte';
    import GetReady from './GetReady.svelte';
    import AudioPlayer from './AudioPlayer.svelte';
    import SButton from './SButton.svelte';

    import { currentStep, prevStep, clearStore } from './store.js';

    let step;

    $: currentStep.subscribe((value) => {
        step = value;
    });
    function handlePlaybackComplete() {
        alert('Session complete!');
    }
    function handleClose() {
        clearStore();
        window.location.href = '/selbsthypnose/';
    }
</script>

{#if step > 2 && step < 6}
    <SButton className="absolute top-6 left-4" on:click={prevStep}>Back</SButton>
{/if}
{#if step === 2 || step === 5}
    <SButton className="absolute __top-6 top-24 left-4" on:click={handleClose}>Close</SButton>
{/if}

<div class="py-20 flex flex-col items-center text-center">
    <div class="max-w-[340px] w-full">
        <!-- {#if step === 1}
            <ProfileSelection /> -->
        {#if step === 2}
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
