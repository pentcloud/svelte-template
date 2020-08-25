<script>
	export let size = 2
	export let icon = 'gear'
	export let inactiveColor = "#666"
	export let color = "#333333"
	export let borderRadius = 1
	export let clickable = false
	export let hoverable = false
	export let active = false
	$: style = `
		${clickable ? 'cursor:pointer': ''}; 
		width:${size}em;
		height:${size}em;
		border-radius: ${borderRadius}em;
		--color: ${hoverable == true && active == false ? inactiveColor : color}; 
		background-color: ${hoverable ? '' : `${color}23`};
		--hoverable: ${hoverable ? `${color}23` : ''};
		--active: ${active ? `${color}23` : ''};
`
</script>

<style>
	span{
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		transition: all 0.15s;
		color: var(--color)
	}
	span:hover{
		background-color: var(--hoverable)
	}
	.active{
				color: var(--color);
				background-color: var(--active)
	}
	
</style>
<span on:click={e => active = !active} style={style} class:active on:click>
	<sl-icon style="font-size: {size * 0.5}em; " name={icon}/>
</span>
