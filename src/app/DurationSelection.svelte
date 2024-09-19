<script>
    import { selectedDuration, nextStep } from './store.js';
    import SButton from './SButton.svelte';

    const durations = [7, 15, 30];
    function selectDuration(duration) {
        console.log(duration);
        selectedDuration.set(duration);
        nextStep();
    }
</script>

<h2 class="text-3xl font-black mb-10">Select Duration</h2>
<ul class="flex flex-col gap-4">
    {#each durations as duration}
        <li>
            <SButton on:click={() => selectDuration(duration)}>{duration} minutes</SButton>
        </li>
    {/each}
</ul>
