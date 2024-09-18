<script>
    import { selectedTopic, nextStep } from './store.js';
    import SButton from './SButton.svelte';

    const topics = [
        { id: 'relaxation', name: 'Post session exercise', description: 'You already had a session with me and you want to train yourself' },
        { id: 'discovery', name: 'Discover self hypnosis', description: 'You want to discover hypnosis and want to know what a session could look like' }
    ];

    function selectTopic(topic) {
        selectedTopic.set(topic);
        nextStep();
    }
</script>

<h2 class="text-3xl font-black mb-8">Select a Topic</h2>
<ul class="flex flex-col gap-4 max-w-[380px]">
    {#each topics as topic}
        <li class=" p-8 w-full rounded-xl overflow-hidden relative z-10 shadow-lg">
            <div class="mb-4">{topic.description}</div>
            <SButton on:click={() => selectTopic(topic)}>{topic.name}</SButton>
        </li>
    {/each}
</ul>
