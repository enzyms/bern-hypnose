<script>
    // import { onMount } from 'svelte';
    import { currentTime, duration, status } from './store.js';

    export let audioPlayer;
    // export let isPlaying;

    let circle;
    let dot;
    let path;
    // let totalLength = 0;
    let isDragging = false;
    // let timeUpdateHandler;
    // let isInitialized = false;

    // onMount(() => {
    //     // Set up event listeners
    //     if ($audioPlayer) {
    //         timeUpdateHandler = handleTimeUpdate;
    //         $audioPlayer.addEventListener('timeupdate', timeUpdateHandler);
    //         $audioPlayer.addEventListener('ended', () => {
    //             path.style.strokeDashoffset = totalLength;
    //         });
    //     }
    //     isInitialized = true;
    // });

    function handleDrag(event) {
        status.set('seeking');
        const totalLength = path.getTotalLength();
        // path.style.strokeDasharray = totalLength;
        // path.style.strokeDashoffset = totalLength;

        const bounds = circle.getBoundingClientRect();
        const radius = bounds.width / 2;
        const dx = event.clientX - (bounds.left + radius);
        const dy = event.clientY - (bounds.top + radius);
        let angle = Math.atan2(dy, dx);

        if (angle < 0) {
            angle += 2 * Math.PI;
        }

        angle = (angle + Math.PI / 2) % (2 * Math.PI);
        const percentage = (angle / (2 * Math.PI)) * 100;

        // Update store instead of directly setting audio time
        currentTime.set(($duration * percentage) / 100);
        // console.log('duration', $duration);
        // console.log('percentage', percentage);
        // console.log('currentTime', ($duration * percentage) / 100);

        const point = path.getPointAtLength((percentage / 100) * totalLength);
        dot.setAttribute('cx', point.x);
        dot.setAttribute('cy', point.y);
    }

    function handleMouseDown(event) {
        console.log('handleMouseDown');
        isDragging = true;
        handleDrag(event);
    }

    function handleMouseUp() {
        console.log('handleMouseUp');
        isDragging = false;
        status.set('playing');
    }

    // function handleTimeUpdate() {
    //     if (!$audioPlayer || isDragging) return;

    //     const { currentTime, duration } = $audioPlayer;
    //     const calc = totalLength - (currentTime / duration) * totalLength;
    //     path.style.strokeDashoffset = calc;

    //     const percentage = (currentTime / duration) * 100;
    //     const point = path.getPointAtLength((percentage / 100) * totalLength);
    //     dot.setAttribute('cx', point.x);
    //     dot.setAttribute('cy', point.y);
    // }

    // // Update the seeker position when currentTime changes
    // $: if (path && $currentTime) {
    //     const percentage = ($currentTime / $duration) * 100;
    //     const point = path.getPointAtLength((percentage / 100) * totalLength);
    //     if (dot) {
    //         dot.setAttribute('cx', point.x);
    //         dot.setAttribute('cy', point.y);
    //     }
    // }
</script>

<svelte:window on:mousemove={(e) => isDragging && handleDrag(e)} on:mouseup|preventDefault|stopPropagation={handleMouseUp} />

<figure class="audio__controls">
    <svg version="1.1" id="circle" viewBox="0 0 100 100" bind:this={circle} alt="Audio Seekbar" class="w-full h-full overflow-visible">
        <path
            bind:this={path}
            fill="none"
            stroke="none"
            d="M50,2.9L50,2.9C76,2.9,97.1,24,97.1,50v0C97.1,76,76,97.1,50,97.1h0C24,97.1,2.9,76,2.9,50v0C2.9,24,24,2.9,50,2.9z"
        />
        <circle
            id="seekdot"
            bind:this={dot}
            class="progress-handle pointer-events-auto"
            r="4"
            cx="50"
            cy="2"
            fill="green"
            role="button"
            tabindex="0"
            aria-label="Drag to seek audio"
            on:mousedown={handleMouseDown}
            on:mouseup={handleMouseUp}
        />
    </svg>
</figure>

<style>
    .progress-handle {
        cursor: pointer;
        transition: r 0.2s ease;
    }

    .progress-handle:hover {
        r: 6;
    }
</style>
