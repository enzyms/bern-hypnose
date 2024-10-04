<script>
    import { selectedProfile, nextStep } from './store.js';
    import SButton from './SButton.svelte';

    import imgAdult from '@assets/app/introspection.png';
    import imgChild from '@assets/app/child.png';

    const profiles = [
        { id: 'adult', name: 'Erwachsene', description: 'Short description here', image: imgAdult },
        { id: 'child', name: 'Kinder', description: 'Short description here', image: imgChild }
    ];

    function selectProfile(profile) {
        selectedProfile.set(profile);
        nextStep();
    }
</script>

<h2 class="text-3xl font-black mb-10">Select a Profile</h2>
<ul class="flex flex-col gap-6">
    {#each profiles as profile}
        <li class="relative">
            <button class="card group" on:click={() => selectProfile(profile)}>
                <div
                    class="absolute z-0 top-0 right-0 bottom-0 left-0 rounded-xl transition-all duration-500 ease-in-out opacity-0 group-hover:opacity-50 group-hover:scale-[1.4] bg-yellow-300 blur-3xl pointer-events-none"
                ></div>
                <div class="card__image">
                    <img src={profile.image.src} alt="" />
                </div>
                <h3 class="card__title">{profile.name}</h3>
            </button>
        </li>
    {/each}
</ul>

<style>
    .card {
        @apply block relative cursor-pointer;
    }
    .card__image {
        @apply w-full rounded-xl overflow-hidden relative z-10 shadow-lg aspect-[5/3];
    }

    .card__image img {
        @apply w-full h-full object-cover object-center;
        @apply group-hover:scale-[1.05] transition-transform duration-500 ease-in-out object-cover object-center;
    }
    .card__title {
        @apply px-2 py-2 !text-base md:!text-lg font-bold !leading-snug text-red-700 group-hover:text-red-500 transition-colors relative z-10;
    }
</style>
