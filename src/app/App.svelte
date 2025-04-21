<script>
    /* import ProfileSelection from './ProfileSelection.svelte'; */
    import TopicSelection from './TopicSelection.svelte';
    import AmbientSelection from './AmbientSelection.svelte';
    import GetReady from './GetReady.svelte';
    import AudioPlayer from './AudioPlayer.svelte';
    import SButton from './SButton.svelte';

    import { currentStep, clearStore, pageTitle, showIntroCover, showContent } from './store.js';
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';

    let step;
    let isMenuOpen = false;

    $: currentStep.subscribe((value) => {
        step = value;
    });

    $: if ($showIntroCover) {
        setTimeout(() => {
            showIntroCover.set(false);
            setTimeout(() => {
                showContent.set(true);
            }, 300);
        }, 1500);
    }

    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
        const button = document.querySelector('button');
        button?.classList.toggle('is-active');
    }
    function handleClose() {
        clearStore();
        window.location.href = '/';
    }
    function restartApp() {
        toggleMenu();
        clearStore();
        showIntroCover.set(true);
        showContent.set(false);
    }
</script>

{#if $showIntroCover}
    <div class="fixed inset-0 pb-12 flex flex-col justify-center items-center z-50 pt-[env(safe-area-inset-top)]" transition:fade={{ duration: 300 }}>
        <h1 class="text-4xl text-center font-black text-red-600 pt-20 md:pt-24">Geführte Kurzhypnose</h1>
        <p class="pt-8">Stimme: Janine Aerni</p>
        <p>Musik: Nathan Czuczor</p>
    </div>
{/if}

{#if $showContent}
    <div transition:fade={{ duration: 300 }}>
        <div class="fixed left-0 top-0 right-0 z-20 py-6 md:py-8 lg:py-10 bg-primary/5 backdrop-blur-lg text-center">
            <h1 class="text-2xl font-black text-gray-950 pt-[env(safe-area-inset-top)]">
                {$pageTitle}
            </h1>
        </div>

        <div class="py-24 md:py-28 lg:py-32 px-8 flex flex-col items-center text-center">
            <div class="max-w-[340px] w-full">
                <!-- {#if step === 1}
                    <ProfileSelection /> -->
                {#if step === 2}
                    <TopicSelection />
                {:else if step === 3}
                    <AmbientSelection />
                {:else if step === 4}
                    <GetReady />
                {:else if step === 5}
                    <AudioPlayer />
                {/if}
            </div>
        </div>

        <div class="fixed left-0 bottom-0 right-0 z-50 py-4 md:py-6 lg:py-8 bg-primary/5 backdrop-blur-lg text-center">
            <div class="pb-[env(safe-area-inset-bottom)]">
                <SButton variant="solid" on:click={toggleMenu} class="relative" aria-label="Toggle Menu" aria-expanded={isMenuOpen}>
                    <span class={`burger-icon ${isMenuOpen ? 'is-active' : ''}`}>
                        <span class="bar" />
                    </span>
                </SButton>
            </div>
        </div>
        <div class={`menu flex items-center ${!isMenuOpen ? 'translate-y-[120px] opacity-0 pointer-events-none' : ''}`}>
            <div class="py-12 max-w-[340px] mx-auto flex flex-col gap-4">
                <SButton variant="solid" className="w-full" on:click={restartApp}>Erneut starten</SButton>
                <SButton variant="solid" className="w-full" on:click={handleClose}>Webseite besuchen</SButton>
            </div>
        </div>
    </div>
{/if}

<style>
    .menu {
        @apply fixed top-0 left-0 bottom-0 w-full z-40 backdrop-blur-lg transition-all duration-500 ease-in-out;
    }
    .burger-icon {
        @apply w-6 h-6 flex items-center justify-center relative;
    }

    .bar {
        @apply w-6 h-[2px] bg-white rounded-full relative transition-all duration-300;
    }

    .bar::before,
    .bar::after {
        content: '';
        @apply w-6 h-[2px] bg-white rounded-full absolute left-0 transition-all duration-300;
    }

    .bar::before {
        transform: translateY(-8px);
    }

    .bar::after {
        transform: translateY(8px);
    }

    /* Active state */
    .is-active .bar {
        @apply bg-transparent;
    }

    .is-active .bar::before {
        transform: rotate(45deg);
    }

    .is-active .bar::after {
        transform: rotate(-45deg);
    }
</style>
