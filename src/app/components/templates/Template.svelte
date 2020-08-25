
<!-- <svelte:options accessors={true}></svelte:options> -->
<script>
    let aside = false
    let slide = ()=>{
        return {
            duration: 200,
            easing:  t => t<.5 ? 2*t*t : -1+(4-2*t)*t,
            css: u => `transform-origin: left; transform: scaleX(${u})`
        }
    }
    function toggle (){
        aside = !aside
    }
    function open (){
        aside = true
    }
    function close (){
        aside = false
    }
</script>
<style>
    .nav{
        position: fixed;
        padding: 5px;
        width: 90px;
        height: calc(100vh - 10px);
        top: 0;
        left: 0;
        overflow: visible;
        z-index: 1;
        display: grid;
        grid-template-columns: 100%;
        grid-gap: 7px;
        place-items: center;
        grid-auto-rows: min-content;
    }
    .aside{
        background: white;
        position: fixed;
        width: 300px;
        height: 100vh;
        top: 0;
        left: 90px;
        overflow: scroll;
        z-index: 2;
    }
    .header{
        padding: 5px;
        position: fixed;
        width: calc(100vw - 100px);
        height: 90px;
        top: 0;
        left: 90px;
        overflow: visible;
        z-index: 1;
    }
    .main{
        position: fixed;
        width: calc(100vw - 90px);
        height: calc(100vh - 90px);;
        top: 90px;
        left: 90px;
        overflow: scroll;
        z-index: 0;
    }
    ::-webkit-scrollbar {
        height: 0;
        width: 0;
    }
    ::-webkit-scrollbar-track {
        width: 0;
        background: #ddd;
    }
    ::-webkit-scrollbar-thumb {
        width: 0;
        background: var(--primary, #666);
    }
    .main::-webkit-scrollbar {
        height: 5px;
        width: 5px;
    }
    .main::-webkit-scrollbar-track {
        width: 5px;
        background: #ddd;
    }
    .main::-webkit-scrollbar-thumb {
        width: 5px;
        background: var(--primary, #666);
    }
</style>

<main>
    <div class="nav">
        <slot name="nav"></slot>
    </div>
    <div class="header">
        <slot name="header"></slot>
    </div>
    <div class="main">
        <slot name="main"></slot>
    </div>
    {#if aside == true}
        <div transition:slide class="aside">
            <slot name="aside"></slot>
        </div>
    {/if}
    <slot open={open} close={close} toggle={toggle}></slot>
</main>