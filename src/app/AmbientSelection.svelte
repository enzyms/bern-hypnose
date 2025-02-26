<script>
    import { selectedAmbientSound, nextStep, pageTitle } from './store.js';
    import SButton from './SButton.svelte';

    const ambientSounds = [
        { id: 'forest', name: 'Vogelstimmen' },
        { id: 'sea', name: 'Meeresgeräusche' },
        { id: 'none', name: 'Ohne Geräusche' }
    ];
    function selectDuration(sound) {
        selectedAmbientSound.set(sound);
        nextStep();
    }

    pageTitle.set('Wähle ein Hintergrundgeräusch');
</script>

<ul class="flex flex-col gap-4">
    {#each ambientSounds as sound}
        <li>
            <SButton className="w-full" on:click={() => selectDuration(sound)}>{sound.name}</SButton>
        </li>
    {/each}
</ul>
