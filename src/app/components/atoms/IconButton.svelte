<script>
    export let icon = 'gear'
    export let circled = false
    export let size = 1
    export let bgColor = '#15CEBC'
    export let fgColor = 'white'

    size = parseInt(size)

    let style = `
                width:${size}em;
                height:${size}em;
                background-color:${bgColor}
                `
</script>

<style>
    .circle{
        border-radius: 50%;
        padding:0.4em 0.5em 0.5em 0.5em;
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>

{#if circled}
    <div class="circle" {style}>
        <sl-icon-button name={icon} style="color:{fgColor};font-size:{size*0.8}em;"></sl-icon-button>
    </div>
    {:else}
        <sl-icon-button name={icon} style="color:{fgColor};font-size:{size*0.8}em;" ></sl-icon-button>    
{/if}