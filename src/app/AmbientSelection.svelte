<script>
    import { selectedAmbientSound, nextStep } from './store.js';
    import SButton from './SButton.svelte';

    const ambientSounds = [
        { id: 'bird', name: 'Bird songs' },
        { id: 'sea', name: 'Noise of the sea' },
        { id: 'none', name: 'None' }
    ];
    function selectDuration(sound) {
        selectedAmbientSound.set(sound.id);
        nextStep();
    }
</script>

<h2 class="text-3xl font-black mb-10">Select ambient sound</h2>
<ul class="flex flex-col gap-4">
    {#each ambientSounds as sound}
        <li>
            <SButton className="w-full" on:click={() => selectDuration(sound)}>{sound.name}</SButton>
        </li>
    {/each}
</ul>
