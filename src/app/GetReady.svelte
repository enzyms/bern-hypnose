<script>
    import { nextStep, selectedDuration, selectedAmbientSound, pageTitle } from './store.js';
    import SButton from './SButton.svelte';

    pageTitle.set('Bereit für die Hypnose?');
</script>

<ul class="mb-8">
    <li>Wähle einen ruhigen Ort</li>
    <li>Mach es dir bequem</li>
    <li>Los geht's!</li>
</ul>
<ul class="mb-8">
    <li>Dauer: {$selectedDuration} Minuten</li>
    <li>Hintergrundgeräusch: {$selectedAmbientSound.name}</li>
</ul>

<SButton on:click={() => nextStep()}>Beginnen</SButton>
