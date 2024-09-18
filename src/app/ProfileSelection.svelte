<script>
    import { selectedProfile, nextStep } from './store.js';
    import SButton from './SButton.svelte';

    const profiles = [
        { id: 'adult', name: 'Erwachsene' },
        { id: 'child', name: 'Kinder' }
    ];

    function selectProfile(profile) {
        selectedProfile.set(profile);
        nextStep();
    }
</script>

<h2 class="text-3xl font-black mb-8">Select a Profile</h2>
<ul class="flex flex-col gap-4">
    {#each profiles as profile}
        <li>
            <SButton on:click={() => selectProfile(profile)}>{profile.name}</SButton>
        </li>
    {/each}
</ul>
