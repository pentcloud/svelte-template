<svelte:options accessors={true}></svelte:options>
<script>
    // import {blur} from 'svelte/transition'
        let view = false;
        export let duration = 150;
        export let offsetLeft = 0
        export let offsetRight = 0
        export let offsetTop = 0
        export let offsetBottom = 0
        export let borderRadius = 0
        export let shadow = 0
    
        function blur(node, params){
            let {duration} = params
            return{
                easing: t => t*t*t,
                duration,
                css: u => {
                    return `opacity: ${u};`
                }
            }
        }
        export function open(){
            view = true
        }
        export function close(){
            view = false
        }
        export function toggle(){
            view = !view
        }
    </script>
    
    <style>
            ::-webkit-scrollbar {
                width: 0px;
                height: 0px;  /* Remove scrollbar space */
                background: transparent;  /* Optional: just make scrollbar invisible */
                }
        .modal{
            position: fixed;
            z-index: 100;
            overflow:scroll;
            background-color: white;
        }
        .close{
            cursor: pointer;
            position: fixed;
            user-select: none;
            border-radius: 50px;
            background: white;
        }
        @media screen and (max-width: 768px){
           
        }
    </style>
    
    {#if view == true}
        <div transition:blur={{duration: duration}} class="modal" style="box-shadow: 0 0 {7*shadow}px rgb(150,150,150,{shadow}); border-radius: {borderRadius}px; width: {100 - offsetLeft - offsetRight}vw; height: {100 - offsetTop - offsetBottom}vh ; top: {0 + offsetTop}vh; left: {0 + offsetLeft}vw;">
        <svg style=" top: calc(25px + {offsetTop}vh); right: calc(25px + {offsetRight}vw);" class="close" on:click={() => view = false} xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 512 512"><path d="M448,256c0-106-86-192-192-192S64,150,64,256s86,192,192,192S448,362,448,256Z" style="fill:none;stroke:#666;stroke-miterlimit:10;stroke-width:32px"/><line x1="320" y1="320" x2="192" y2="192" style="fill:none;stroke:#666;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px"/><line x1="192" y1="320" x2="320" y2="192" style="fill:none;stroke:#666;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px"/></svg>
            <slot></slot>
        </div>
        <slot name="actions" open={open} close={close} toggle={toggle}></slot>
    {/if}