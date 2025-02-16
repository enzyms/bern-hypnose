<script>
    export let progress;

    $: angle = Math.floor(progress) * 360;

    // Adapt the logic according to the approach
    const background = `radial-gradient(white 50%, transparent 51%),
    conic-gradient(transparent 0deg ${angle}deg, gainsboro ${angle}deg 360deg),
    conic-gradient(orange 0deg, yellow 90deg, lightgreen 180deg, green);`;

    $: cssVarStyles = `--background:${background}`;
</script>

<div id="progress-circle" style={cssVarStyles}>
    {angle}
</div>

<style>
    #progress-circle {
        background: var(--background);
        border-radius: 50%;
        width: 120px;
        height: 120px;
        transition: all 500ms ease-in;
        will-change: transform;

        border: 1px solid red;
    }
</style>
