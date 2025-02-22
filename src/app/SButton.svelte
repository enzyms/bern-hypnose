<script>
    export let href = null; // href determines if the component is a link
    export let className = ''; // Custom class to pass to the button or link
    export let restProps = {}; // To pass other attributes like onClick, etc.
    export let variant = 'outline'; // 'outline' or 'solid'

    const outlineClasses = 'text-red-600 bg-transparent border border-red-600 hover:bg-red-500 hover:text-red-50';
    const solidClasses = 'text-white bg-red-600 border border-red-600 hover:bg-red-500';

    const buttonClasses = `inline-flex items-center justify-center px-6 py-3 text-base leading-tight font-bold rounded-full transition ${variant === 'outline' ? outlineClasses : solidClasses}`;
</script>

{#if href}
    <!-- Render an anchor tag if href is provided -->
    <a {href} class={`${buttonClasses} ${className}`} {...restProps}>
        <slot />
    </a>
{:else}
    <!-- Render a button if no href is provided -->
    <button class={`${buttonClasses} ${className}`} {...restProps} on:click>
        <slot />
    </button>
{/if}
