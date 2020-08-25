<script>
	export let width = 'auto'
	export let shadow = 0
	export let borderRadius = 0
	export let icon = 'gear'
	export let clickable = false;
	export let iconSize = 1
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

		grid-template-areas: 
		"icon header"
		"icon text";
	}
	.right{
		grid-template-areas: 
		"header icon"
		"text icon";
	}
	.icon-container{
		display: contents;
		place-self: center;
	}
	.icon{
		place-self: center;
		grid-area: icon;
	}
	.header{
		grid-area: header;
	}
	.text{
		grid-area: text;
	}
	
</style>

<main class={position} style="margin: {margin}; width: {width};padding: {padding}px; background-color: {background}; box-shadow: 0 0 {7*shadow}px rgb(100,100,100,{shadow}); border-radius: {borderRadius}px; grid-template-columns: {position == 'left' ? `${iconSize * 1.4}em auto` : ` auto ${iconSize * 1.4}em`};">
	<span class="icon-container" style="font-size: {iconSize}em; {clickable ? 'cursor: pointer;' : ''}">
			<sl-icon class='icon' name={icon} on:click></sl-icon>
	</span>
	<div class="header" style="font-size: {header}em">
		<slot name="header"></slot>
	</div>
		<div class="text" style="font-size: {text}em">
		<slot name="text"></slot>
	</div>
</main>