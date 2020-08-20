<script>
    export let title = false;
    export let text = "";
    export let size = "1em";
    export let color = "auto";
    export let weight = "400";
    export let margin = "0em";
    export let padding = "0em";
    export let align = "left";
    export let href = false;
    export let opacity = 1;
    export let w = "auto";
    export let background = "transparent";


    let style;

    $: style = `
    --size:${size};
    --color:${color};
    --weight:${weight};
    --margin:${margin};
    --align:${align};
    --opacity:${opacity};
    --width:${w};
    --padding:${padding};
    --background:${background};
    `

</script>

<style>
    h1, p, a{
        font-size: var(--size);
        color: var(--color);
        background: var(--background);
        margin:var(--margin);
        padding:var(--padding);
        font-weight: var(--weight);
        text-align: var(--align);
        white-space: pre;
        opacity: var(--opacity);
        width: var(--width);
         -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
     -khtml-user-select: none; /* Konqueror HTML */
       -moz-user-select: none; /* Old versions of Firefox */
        -ms-user-select: none; /* Internet Explorer/Edge */
            user-select: none; /* Non-prefixed version, currently
                                  supported by Chrome, Edge, Opera and Firefox */
-webkit-tap-highlight-color: rgba(0,0,0,0);
-webkit-tap-highlight-color: transparent;
        white-space: pre-line;
    }

    /* *:hover{
        background: var(--hoverBackground);
        color: var(--hoverColor);
    } */
</style>

    {#if title}
        <h1 {style} on:click>{text}</h1>
    {:else if href}
        <a {href} {style} on:click>{text}</a>
    {:else if text}
        <p {style} on:click>{text}</p>
    {:else}
        <p {style} on:click>
            <slot></slot>
        </p>
    {/if}

