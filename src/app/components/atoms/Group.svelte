<script>
    export let direction = 'column'
    export let width = "auto"
    export let justify = "flex-start"

    let style = `
                --direction:${direction};
                --width:${width};
                --justify:${justify};
                `
</script>

<style>
    .Group{
        display:flex;
        flex-direction: var(--direction);
        justify-content: var(--justify);
        line-height: var(--line-height);
        width: var(--width);
    }
</style>

<div class="Group" {style}>
    <slot></slot>
</div>