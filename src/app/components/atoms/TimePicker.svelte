<script>
	export let value
	let am = true
	const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
	const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
	const seconds = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
	let screen = 0
	export let hour = 0
	export let minute = 0
	export let second = 0
	let id =
		Math.random().toString(36).substring(2) +
		Math.random().toString(36).substring(2)
	let angle = 4.71
	let radius = 75
	let plots = 12
	let increase = (Math.PI * 2) / plots
	$: hour > 12 ? (hour = 1) : ''
	$: minute > 59 ? (minute = 0) : ''
	$: second > 59 ? (second = 0) : ''
	$: screen > 4 ? (screen = 0) : ''
	$: hour < 1 ? (hour = 12) : ''
	$: minute < 0 ? (minute = 59) : ''
	$: second < 0 ? (second = 59) : ''
	$: screen < 0 ? (screen = 4) : ''

	$: {
		hour
		minute
		second
		am
		value = makeValue()
	}

	function makeValue() {
		if (am) {
			return `${
				hour < 10 ? `0${hour == 12 ? 0 : hour}` : `${hour == 12 ? 0 : hour}`
			}:${minute < 10 ? `0${minute}` : minute}:${
				second < 10 ? `0${second}` : second
			}`
		} else {
			// console.log(hour+12)
			// let offset = hour == 12 ? 0 : 12
			return `${hour == 12 ? hour : hour + 12}:${
				minute < 10 ? `0${minute}` : minute
			}:${second < 10 ? `0${second}` : second}`
		}
	}
	function scale() {
		return {
			duration: 200,
			css: (u) =>
				`transform-origin: top left; transform: scale(${u}); position: absolute; opacity: ${u}`,
		}
	}
	function keydown(e) {
		if ([37, 38, 39, 40, 13, 32].includes(e.keyCode) == false || screen == 0)
			return
		//38 up, 40 down, 37 left, 39 right
		e.preventDefault()
		if (screen == 1) {
			e.keyCode == 38 ? hour++ : ''
			e.keyCode == 40 ? hour-- : ''
			e.keyCode == 39 ? screen++ : ''
		} else if (screen == 2) {
			e.keyCode == 38 ? minute++ : ''
			e.keyCode == 40 ? minute-- : ''
			e.keyCode == 37 ? screen-- : ''
			e.keyCode == 39 ? screen++ : ''
		} else if (screen == 3) {
			e.keyCode == 38 ? second++ : ''
			e.keyCode == 40 ? second-- : ''
			e.keyCode == 37 ? screen-- : ''
			e.keyCode == 39 ? screen++ : ''
		} else if (screen == 4) {
			e.keyCode == 38 || e.keyCode == 40  ? am = !am : ''
			e.keyCode == 37 ? screen-- : ''
			e.keyCode == 39 ? screen = 1 : ''
		}
		e.keyCode == 13 || e.keyCode == 32 ? (screen = 0) : ''
	}
</script>

<style>
	main {
		margin: 3px;
		display: inline-grid;
		border-radius: 4px;
		padding: 4px;
	}
	div {
		top: 50px;
		box-shadow: 0 0 4px #ddd;
		background: white;
		display: flex;
		z-index: 100;
		position: absolute;
		width: 200px;
		height: 200px;
		border-radius: 25px;
		justify-content: center;
	}
	.button {
		transform-origin: center;
		position: absolute;
		left: 83.5px;
		top: 83.5px;
		user-select: none;
		width: 32px;
		height: 32px;
		color: #666;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 13px;
		border-radius: 50px;
		cursor: pointer;
		transition: all 0.15s;
	}
	.button:hover {
		background: #f7f7f7;
	}
	.value {
		z-index: 2;
		display: inline-flex;
		/* 		transform-origin: center; */
		position: relative;
		padding: 5px;
		user-select: none;
		align-self: center;
		justify-self: center;
		align-items: center;
		font-size: 13px;
		border-radius: 3px;
		cursor: pointer;
		transition: all 0.15s;
		/* 		white-space: pre-wrap; */
	}
	.minimized {
		background: white;
		box-shadow: 0 0 4px #ddd;
	}
	.value-element {
		display: inline-grid;
		border-radius: 4px;
		padding: 6px 3px;
		margin: 0 1px;
	}
	.value-element:hover {
		background: #f7f7f7;
	}
	.active {
		background: #f7f7f7;
	}
	.up {
		transform: rotate(-90deg);
	}
	.down {
		transform: rotate(90deg);
	}
	.done {
		cursor: pointer;
		fill: #333;
		padding: 4px;
		position: absolute;
		bottom: 10px;
		right: 10px;
		border-radius: 50px;
		transition: all 0.2s;
	}
	.done:hover {
		background-color: #f7f7f7;
	}
</style>

<svelte:window on:keydown={keydown} on:click={(e) => (screen = 0)} />
<main {id}>
	<span transition:scale class="value minimized">
		<span
			on:click|stopPropagation={() => (screen = 1)}
			class="value-element {screen == 1 ? 'active' : ''}">
			{hour < 10 ? `0${hour}` : hour}
		</span>
		:
		<span
			on:click|stopPropagation={() => (screen = 2)}
			class="value-element {screen == 2 ? 'active' : ''}">
			{minute < 10 ? `0${minute}` : minute}
		</span>
		:
		<span
			on:click|stopPropagation={() => (screen = 3)}
			class="value-element {screen == 3 ? 'active' : ''}">
			{second < 10 ? `0${second}` : second}
		</span>
		<span class="value-element" on:click|stopPropagation={(e) => (am = !am)}>
			{am ? ' AM' : ' PM'}
		</span>
	</span>
	{#if screen > 0}
		<div transition:scale>
			{#if screen == 1}
				{#each hours as h, index}
					<span
						class="button"
						on:click|stopPropagation={() => {
							hour = h
							screen++
						}}
						style="transform: translateX({radius * Math.cos(angle + increase * index)}px)
						translateY({radius * Math.sin(angle + increase * index)}px);">
						{h}
					</span>
				{/each}
			{:else if screen == 2}
				{#each minutes as m, index}
					<span
						class="button"
						on:click|stopPropagation={() => {
							minute = m
							screen++
						}}
						style="transform: translateX({radius * Math.cos(angle + increase * index)}px)
						translateY({radius * Math.sin(angle + increase * index)}px);">
						{m}
					</span>
				{/each}
			{:else if screen == 3 || screen == 4}
				{#each seconds as s, index}
					<span
						class="button"
						on:click|stopPropagation={() => {
							second = s
							screen == 3 ? screen++ : ''
						}}
						style="transform: translateX({radius * Math.cos(angle + increase * index)}px)
						translateY({radius * Math.sin(angle + increase * index)}px);">
						{s}
					</span>
				{/each}
			{/if}
			<span class="value">
				<span
					on:click|stopPropagation={() => (screen = 1)}
					class="value-element {screen == 1 ? 'active' : ''}">
					{#if screen == 1}
						<svg
							class="up"
							on:click|stopPropagation={() => hour++}
							xmlns="http://www.w3.org/2000/svg"
							height="18"
							viewBox="0 0 24 24"
							width="18">
							<path d="M0 0h24v24H0z" fill="none" />
							<path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
						</svg>
					{/if}
					{hour < 10 ? `0${hour}` : hour}
					{#if screen == 1}
						<svg
							on:click|stopPropagation={() => hour--}
							class="down"
							xmlns="http://www.w3.org/2000/svg"
							height="18"
							viewBox="0 0 24 24"
							width="18">
							<path d="M0 0h24v24H0z" fill="none" />
							<path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
						</svg>
					{/if}
				</span>
				:
				<span
					on:click|stopPropagation={() => (screen = 2)}
					class="value-element {screen == 2 ? 'active' : ''}">
					{#if screen == 2}
						<svg
							class="up"
							on:click|stopPropagation={() => minute++}
							xmlns="http://www.w3.org/2000/svg"
							height="18"
							viewBox="0 0 24 24"
							width="18">
							<path d="M0 0h24v24H0z" fill="none" />
							<path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
						</svg>
					{/if}
					{minute < 10 ? `0${minute}` : minute}
					{#if screen == 2}
						<svg
							on:click|stopPropagation={() => minute--}
							class="down"
							xmlns="http://www.w3.org/2000/svg"
							height="18"
							viewBox="0 0 24 24"
							width="18">
							<path d="M0 0h24v24H0z" fill="none" />
							<path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
						</svg>
					{/if}
				</span>
				:
				<span
					on:click|stopPropagation={() => (screen = 3)}
					class="value-element {screen == 3 ? 'active' : ''}">
					{#if screen == 3}
						<svg
							class="up"
							on:click|stopPropagation={() => second++}
							xmlns="http://www.w3.org/2000/svg"
							height="18"
							viewBox="0 0 24 24"
							width="18">
							<path d="M0 0h24v24H0z" fill="none" />
							<path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
						</svg>
					{/if}
					{second < 10 ? `0${second}` : second}
					{#if screen == 3}
						<svg
							on:click|stopPropagation={() => second--}
							class="down"
							xmlns="http://www.w3.org/2000/svg"
							height="18"
							viewBox="0 0 24 24"
							width="18">
							<path d="M0 0h24v24H0z" fill="none" />
							<path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
						</svg>
					{/if}
				</span>
				<span class="value-element {screen == 4 ? 'active' : ''}" on:click|stopPropagation={(e) => (am = !am)}>
					{#if screen == 4}
						<svg
							class="up"
							on:click|stopPropagation={() => am = !am}
							xmlns="http://www.w3.org/2000/svg"
							height="18"
							viewBox="0 0 24 24"
							width="18">
							<path d="M0 0h24v24H0z" fill="none" />
							<path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
						</svg>
					{/if}
					{am ? ' AM' : ' PM'}
					{#if screen == 4}
						<svg
							class="down"
							on:click|stopPropagation={() => am = !am}
							xmlns="http://www.w3.org/2000/svg"
							height="18"
							viewBox="0 0 24 24"
							width="18">
							<path d="M0 0h24v24H0z" fill="none" />
							<path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
						</svg>
					{/if}
				</span>
			</span>
			<svg
				class="done"
				on:click|stopPropagation={(e) => (screen = 0)}
				xmlns="http://www.w3.org/2000/svg"
				height="24"
				viewBox="0 0 24 24"
				width="24">
				<path d="M0 0h24v24H0z" fill="none" />
				<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
			</svg>
		</div>
	{/if}
</main>
