<script>
    import { nextStep, selectedDuration, selectedAmbientSound, selectedTopic, pageTitle } from './store.js';
    import SButton from './SButton.svelte';

    pageTitle.set('Bereit für die Hypnose?');
</script>

<ul class="mb-8">
    <li>Wähle einen ruhigen Ort</li>
    <li>Mach es dir bequem</li>
    <li>Los geht's!</li>
</ul>
<ul class="mb-8">
    <li>Thema: {$selectedTopic.name}</li>
    <li>Umgebungsmusik: {$selectedAmbientSound.name}</li>
    <li>Dauer: {$selectedDuration} Minuten</li>
</ul>

<SButton on:click={() => nextStep()}>Beginnen</SButton>
