<script>
    import { nextStep, selectedDuration, selectedAmbientSound, pageTitle } from './store.js';
    import SButton from './SButton.svelte';

    pageTitle.set('Get Ready');
</script>

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
