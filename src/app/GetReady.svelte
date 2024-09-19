<script>
    import { nextStep, selectedDuration, selectedAmbientSound } from './store.js';
    import SButton from './SButton.svelte';
</script>

<h2 class="text-3xl font-black mb-10">Get Ready</h2>
<ul class="mb-8">
    <li>Find a quiet place</li>
    <li>Get comfortable</li>
    <li>Prepare to relax</li>
</ul>
<ul class="mb-8">
    <li>Duration: {$selectedDuration} minutes</li>
    <li>Ambient sound: {$selectedAmbientSound.name}</li>
</ul>

<SButton on:click={() => nextStep()}>Start session</SButton>
