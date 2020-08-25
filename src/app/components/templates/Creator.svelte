


<style>
    .top{
        position: fixed;
        width: 100vw;
        height: 35vh;
        top: 0;
        left: 0;
        overflow: scroll;
    }
    .main{
        position: fixed;
        width: 100vw;
        top: 35vh;
        height: 65vh;
        left: 0;
        overflow: scroll;
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
    <div class="top">
        <slot name="top"></slot>
    </div>
    <div class="main">
        <slot name="main"></slot>
    </div>
</main>