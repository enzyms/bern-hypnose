<script>
    import { selectedProfile, nextStep } from './store.js';

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
