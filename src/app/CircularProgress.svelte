<script>
    export let value = 0;
    export let color = '#dc2626';

    $: progressValue = value;
</script>

<div class="circle" style="--progress: {progressValue}%; --color: {color}"></div>

<style>
    .circle {
        width: 100%;
        aspect-ratio: 1;
        border-radius: 50%;
        padding: 10px;
        background: conic-gradient(var(--color) var(--progress), transparent var(--progress));
        mask: radial-gradient(transparent 66%, black 66% 70%, transparent 70%);
        -webkit-mask: radial-gradient(transparent 66%, black 66% 70%, transparent 70%);
    }
</style>
