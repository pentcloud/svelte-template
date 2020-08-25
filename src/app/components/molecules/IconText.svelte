<script>
    import { Icon, Text } from 'Atoms'
    export let size = 1

    export let fgColor = "white"
    export let bgColor = "#15CEBC"
    export let textColor = "black"

    size = parseInt(size)
    let style = `--line-height:${size}em`

    
</script>

<style>
    .IconText{
        display:flex;
        flex-direction: row;
        line-height: var(--line-height);
    }
</style>

<div class="IconText" {style}>
    <Icon circled size={size} {fgColor} {bgColor}></Icon>
    <Text color={textColor} {size}>Settings</Text>
</div>
