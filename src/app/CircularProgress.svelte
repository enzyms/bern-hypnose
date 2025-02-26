<script>
    export let value = 0;
    export let color = '#dc143c';
    export let decimals = true;

    $: progressValue = decimals ? Math.round((Math.min(Math.max(value, 0), 100) + Number.EPSILON) * 100) / 100 : Math.round(Math.min(Math.max(value, 0), 100));
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
