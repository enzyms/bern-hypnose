<script>
    import { selectedAmbientSound, nextStep, pageTitle, ambientSounds } from './store.js';
    import SButton from './SButton.svelte';
    import { onMount } from 'svelte';

    function selectDuration(sound) {
        selectedAmbientSound.set(sound);
        nextStep();
    }

    pageTitle.set('Hintergrundgeräusch');

    $: sounds = $ambientSounds || [];

    onMount(() => {
        console.log('Component mounted');
    });
</script>

<ul class="flex flex-col gap-4">
    {#each sounds as sound}
        <li>
            <SButton className="w-full" on:click={() => selectDuration(sound)}>{sound.name}</SButton>
        </li>
    {/each}
</ul>
