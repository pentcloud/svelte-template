<script>
    import { Avatar, Text } from 'Atoms'
    export let size = 1
    export let textColor = 'black'
    export let margin = 'auto'

    $: smaller = `${size * 0.8}em`

    size = parseInt(size)
    let style = `--color:${textColor};--margin:${margin}`

    
</script>

<style>
    .User{
        display:flex;
        flex-direction: row;
        color: var(--color);
        margin: var(--margin);
    }
    
    .UserData{
        display:flex;
        margin-left:1em;
        flex-direction: column;
        color: var(--color);
    }   
</style>

<div class="User" {style}>
    <Avatar {size}></Avatar>
    <div class="UserData">
        <Text color={textColor} {size}>Settings</Text>
        <Text color={textColor} size={smaller}>Settings</Text>
    </div>
</div>