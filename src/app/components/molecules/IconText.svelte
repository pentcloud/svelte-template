<script>
	export let width = 'auto'
	export let shadow = 0
	export let borderRadius = 0
	export let icon = 1
	export let clickable = false;
	export let header = 1
	export let text = 1
	export let background = '#fff'
	export let padding = 10
	export let margin = '0'
	export let position = 'left'
</script>

<style>
	main{
		display: grid;
		align-items: center;
	}
	.left{
		grid-template-columns: 25% 75%;
		grid-template-areas: 
		"icon header"
		"icon text";
	}
	.right{
		grid-template-columns: 75% 25%;
		grid-template-areas: 
		"header icon"
		"text icon";
	}
	.icon{
		place-self: center;
/* 		grid-row: 1 / 3; */
/* 		grid-column: 1; */
		grid-area: icon;
	}
	.header{
		grid-area: header;
	}
	.text{
		grid-area: text;
	}
	
</style>

<main class={position} style="margin:{margin}; width: {width};padding: {padding}px; background-color: {background}; box-shadow: 0 0 {7*shadow}px rgb(100,100,100,{shadow}); border-radius: {borderRadius}px; grid-template-columns: {position == 'left' ? `${icon * 1.4}em auto` : ` auto ${icon * 1.4}em`};">
	<span class="icon" style="font-size: {icon}em; {clickable ? 'cursor: pointer;' : ''}" on:click>
		<slot name="icon"></slot>
	</span>
	<div class="header" style="font-size: {header}em">
		<slot name="header"></slot>
	</div>
		<div class="text" style="font-size: {text}em">
		<slot name="text"></slot>
	</div>
</main>