<script>
    import { selectedAmbientSound, nextStep, pageTitle } from './store.js';
    import SButton from './SButton.svelte';

    const ambientSounds = [
        { id: 'forest', name: 'Bird songs' },
        { id: 'sea', name: 'Noise of the sea' },
        { id: 'none', name: 'None' }
    ];
    function selectDuration(sound) {
        selectedAmbientSound.set(sound);
        nextStep();
    }

    pageTitle.set('Select Ambient Sound');
</script>

<ul class="flex flex-col gap-4">
    {#each ambientSounds as sound}
        <li>
            <SButton className="w-full" on:click={() => selectDuration(sound)}>{sound.name}</SButton>
        </li>
    {/each}
</ul>
