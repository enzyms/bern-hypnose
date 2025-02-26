<script>
    import { selectedTopic, selectedProfile, nextStep, pageTitle, selectedDuration } from './store.js';
    import imgRelaxation from '@assets/app/introspection.png';
    import imgPositiveAffirmations from '@assets/app/child.png';

    let topics;

    const topicsAdult = [
        { id: 'relaxation', name: 'Entspannung', duration: 12, image: imgRelaxation },
        { id: 'positive-affirmations', name: 'Positive Affirmationen', duration: 7, image: imgPositiveAffirmations }
    ];

    $: selectedProfile.subscribe((value) => {
        topics = topicsAdult;
    });

    pageTitle.set('Wähle ein Thema');

    function selectTopic(topic) {
        selectedTopic.set(topic);
        selectedDuration.set(topic.duration);
        nextStep();
    }
</script>

<ul class="flex flex-col gap-4">
    {#each topics as topic}
        <li class="relative">
            <button class="card group" on:click={() => selectTopic(topic)}>
                <div
                    class="absolute z-0 top-0 right-0 bottom-0 left-0 rounded-xl transition-all duration-500 ease-in-out opacity-0 group-hover:opacity-50 group-hover:scale-[1.4] bg-yellow-300 blur-3xl pointer-events-none"
                ></div>
                <div class="card__image">
                    <img src={topic.image.src} alt="" />
                </div>
                <h3 class="card__title">
                    {topic.name}
                    <div class="text-sm text-gray-500">({topic.duration} min)</div>
                </h3>
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
