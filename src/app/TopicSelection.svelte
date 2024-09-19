<script>
    import { selectedTopic, selectedProfile, nextStep } from './store.js';
    import SButton from './SButton.svelte';

    let topics;

    const topicsAdult = [
        { id: 'relaxation', name: 'Relaxation' },
        { id: 'focus', name: 'Focus' },
        { id: 'self-confidence', name: 'Self confidence' },
        { id: 'nutrition', name: 'Nutrition' },
        { id: 'smoking', name: 'Smoking' },
        { id: 'fears', name: 'Fears' }
    ];

    const topicsChild = [
        { id: 'focus', name: 'Focus' },
        { id: 'relaxation', name: 'Relaxation' },
        { id: 'self-confidence', name: 'Self confidence' },
        { id: 'nutrition', name: 'Nutrition' },
        { id: 'fears', name: 'Fears' }
    ];

    $: selectedProfile.subscribe((value) => {
        console.log(value);
        topics = value.id === 'adult' ? topicsAdult : topicsChild;
    });

    function selectTopic(topic) {
        selectedTopic.set(topic);
        nextStep();
    }
</script>

<h2 class="text-3xl font-black mb-10">Select a Topic</h2>
<ul class="flex flex-col gap-4">
    {#each topics as topic}
        <li>
            <SButton className="w-full" on:click={() => selectTopic(topic)}>{topic.name}</SButton>
        </li>
    {/each}
</ul>
