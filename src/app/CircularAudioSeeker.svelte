<script>
    import { currentTime, duration, status } from './store.js';

    export let audioPlayer;
    export let timeupdate;

    let circle;
    let dot;
    let path;
    let isDragging = false;

    function getEventCoords(event) {
        if (event.touches && event.touches.length > 0) {
            return {
                clientX: event.touches[0].clientX,
                clientY: event.touches[0].clientY
            };
        }
        return {
            clientX: event.clientX,
            clientY: event.clientY
        };
    }

    function handleDrag(event) {
        status.set('seeking');
        const totalLength = path.getTotalLength();

        const { clientX, clientY } = getEventCoords(event);

        const bounds = circle.getBoundingClientRect();
        const radius = bounds.width / 2;
        const dx = clientX - (bounds.left + radius);
        const dy = clientY - (bounds.top + radius);
        let angle = Math.atan2(dy, dx);

        if (angle < 0) {
            angle += 2 * Math.PI;
        }

        angle = (angle + Math.PI / 2) % (2 * Math.PI);
        const percentage = (angle / (2 * Math.PI)) * 100;

        currentTime.set(($duration * percentage) / 100);

        const point = path.getPointAtLength((percentage / 100) * totalLength);
        dot.setAttribute('cx', point.x);
        dot.setAttribute('cy', point.y);
    }

    function handleDown(event) {
        isDragging = true;
        handleDrag(event);
    }

    function handleUp() {
        isDragging = false;
        status.set('playing');
    }

    function timeUpdate() {
        if (!$audioPlayer || isDragging) return;

        const totalLength = path.getTotalLength();
        const calc = totalLength - ($currentTime / $duration) * totalLength;
        path.style.strokeDashoffset = calc;

        const percentage = ($currentTime / $duration) * 100;
        const point = path.getPointAtLength((percentage / 100) * totalLength);
        dot.setAttribute('cx', point.x);
        dot.setAttribute('cy', point.y);
    }

    $: if (timeupdate) {
        timeUpdate();
    }
</script>

<svelte:window
    on:mousemove={(e) => isDragging && handleDrag(e)}
    on:mouseup|preventDefault|stopPropagation={handleUp}
    on:touchmove={(e) => isDragging && handleDrag(e)}
    on:touchend={handleUp}
/>
<figure class="audio__controls">
    <svg version="1.1" id="circle" viewBox="0 0 100 100" bind:this={circle} alt="Audio Seekbar" class="w-full h-full overflow-visible pointer-events-none">
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
            r="14"
            cx="50"
            cy="2"
            fill="#dc2626"
            stroke="#fff"
            stroke-width="1"
            role="button"
            tabindex="0"
            aria-label="Drag to seek audio"
            on:mousedown={handleDown}
            on:touchstart={handleDown}
        />
    </svg>
</figure>

<style>
    .progress-handle {
        cursor: pointer;
        transition:
            r 0.3s ease,
            cx 0s ease,
            cy 0s ease;
    }

    .progress-handle:hover {
        r: 8;
    }
    .progress-handle:active {
        r: 6;
    }

    .progress-handle:focus {
        outline: none;
        box-shadow: 0 0 0 5px #dc2626;
    }
</style>
