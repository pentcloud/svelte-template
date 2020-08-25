<script>
    import {DatePicker} from './index.js'
    export let from, to

</script>
<style>
    div{
        display: inline-flex;
        align-items: center;
        font-family: inherit;
    }
    span{
        margin: 5px 10px;
    }
</style>

<div>
    <span>De</span>
    <DatePicker bind:value={from}/>
    <span>Hasta</span>
    <DatePicker bind:value={to}/>
</div>