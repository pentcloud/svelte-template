<script>
	export let value
    export let style = ''
    export let from, to // FROM disables everything before FROM. TO disables everything after TO
	let fade = false
	let monthPicker = false
	try {
		value = new Date(value)
	} catch (err) {
		console.log(err)
		value = new Date()
	}
	if ((value.getTime() >= 0 || value.getTime() <= 0) == false) {
		value = new Date()
	}
	let id = (Math.random() * Math.random()).toString(36)
	let open = false
	$: m = value.getMonth()
	$: d = value.getDate()
	$: y = value.getFullYear()
	export let shortMonths = [
		'Ene.',
		'Feb.',
		'Mar.',
		'Abr.',
		'May.',
		'Jun.',
		'Jul.',
		'Ago.',
		'Sept.',
		'Oct.',
		'Nov.',
		'Dic.',
	]
	export let days = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
	export let months = [
		'Enero',
		'Febrero',
		'Marzo',
		'Abril',
		'Mayo',
		'Junio',
		'Julio',
		'Agosto',
		'Septiembre',
		'Octubre',
		'Noviembre',
		'Diciembre',
	]

	let daysInMonth = (month, year) => {
		return new Date(year, month + 1, 0).getDate()
	}
	let offset = (month, year) => {
		return new Date(year, month, 0).getDay()
	}
	$: prevOffset = daysInMonth(m - 1, y) - offset(m, y)
	$: tail = Math.abs(((daysInMonth(m, y) + offset(m, y)) % 7) - 7)
	function selection(day) {
		value = new Date(y, m, day)
		open = false
	}

	function substract() {
		if (monthPicker == false) {
			fade = true
			setTimeout(() => {
				fade = false
			}, 100)
			if (m == 0) {
				m = 11
				y--
			} else {
				m--
			}
		} else {
			y--
		}
	}
	function add() {
		if (monthPicker == false) {
			fade = true
			setTimeout(() => {
				fade = false
			}, 100)
			if (m == 11) {
				m = 0
				y++
			} else {
				m++
			}
		} else {
			y++
		}
	}
	function getDate(date, time = true) {
		let d = new Date(date)
		if ((d.getTime() >= 0 || d.getTime() <= 0) == false) return '-'
		if (time == true) {
			return `${d.getDate() < 10 ? '0' : ''}${d.getDate()}/${
				d.getMonth() + 1 < 10 ? '0' : ''
			}${d.getMonth() + 1}/${d.getFullYear()} - ${
				d.getHours() > 9 ? d.getHours() : `0${d.getHours()}`
			}:${d.getMinutes() > 9 ? d.getMinutes() : `0${d.getMinutes()}`}`
		} else {
			return `${d.getDate() < 10 ? '0' : ''}${d.getDate()}/${
				d.getMonth() + 1 < 10 ? '0' : ''
			}${d.getMonth() + 1}/${d.getFullYear()}`
		}
	}
	function close() {
		open = false
	}

	function scale() {
		return {
			easing: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
			duration: 240,
			css: (e) => `
transform-origin: top left;
transform: scale(${e})
`,
		}
	}
	function reset() {
		m = value.getMonth()
		d = value.getDate()
		y = value.getFullYear()
		open = false
	}
	function check(e) {
		let val = parseInt(e.target.innerText)
		if (Number.isNaN(val) || val < 1900 || val > 3000) {
			e.target.innerText = y
		} else {
			y = val
		}
	}
	function handleKey(e){
		if((e.keyCode >= 48 && e.keyCode <= 57 ) || (e.keyCode >= 96 && e.keyCode <= 105 ) || [37,39,8,46].includes(e.keyCode) ){
		return
		}
		e.preventDefault()
	}
</script>

<style>
	.calendar {
		position: absolute;
		background: white;
		width: 320px;
		z-index: 100;
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		grid-gap: 10px;
		place-items: center;
		box-shadow: 0 0 4px #ccc;
		padding: 20px;
		border-radius: 3px;
	}
	.day {
		border-radius: 50px;
		width: 36px;
		height: 36px;
		display: flex;
		margin: 0;
		color: #555;
    	font-weight: 500;
		/* 		border: solid 1px #aaa; */
		justify-content: center;
		align-items: center;
		user-select: none;
		cursor: pointer;
		transition: ease all 0.2s;
		font-size: 12px;
	}
	.day:hover {
		/* 		box-shadow: 0px 0px 5px #ddd; */
		background: #eee;
	}
	.day:active {
		background-color: #fff;
		box-shadow: 0px 0px 0 #fff;
	}
	.month {
		font-size: 20px;
		margin: 3px;
		grid-column: 1 / -1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
	}
	.disabled {
		color: #ccc;
		/* 		border: solid 1px #ccc; */
	}
	.weekday {
		user-select: none;
		font-weight: bold;
		color: #333;
		font-size: 14px;
	}
	.flip {
		transform: rotate(180deg);
	}
	.month-text,
	svg,
	.button {
		user-select: none;
		cursor: pointer;
	}
	.month-text{
		color: #555;
    	font-weight: 500;
	}
	.date {
		margin-left: 7px;
	}
	.button {
		background: #f7f7f7;
		position: absolute;
		top: 0;
		width: 90%;
		padding: 10px 5%;
		font-size: 12px;
		font-weight: 500;
		display: inline-flex;
		align-items: center;
		justify-content: space-between;
		border-radius: 2px;
	}
	.selected {
		background-color: #e0f7f7;
	}
	.selected:hover {
		background-color: #e0f7f7 !important;
	}
	main {
		
		display: block;
		width: 110px;
		position: relative;
		margin: 4px;
		min-height: 40px;
	}
	.month-picker {
		width: 100%;
		grid-column: 1 / -1;
		display: grid;
		grid-gap: 5px;
		grid-template-columns: repeat(3, 1fr);
		grid-template-rows: repeat(4, 1fr);
	}
	.month-element {
		width: 100%;
		height: 45px;
		display: flex;
		align-items: center;
		justify-content: center;
		/* 		border: solid 1px #ddd; */
		cursor: pointer;
		user-select: none;
		transition: all 0.2s;
	}
	.month-element:hover {
		background-color: #f0f0f0;
		/* 		box-shadow: 0px 0px 5px #ddd; */
	}
	.month-element:active {
		background-color: #fff;
		box-shadow: 0px 0px 0 #fff;
	}
	.fade {
		opacity: 0.4;
		filter: blur(1px);
	}
	.year-text {
		cursor: text;
		outline: none;
	}
</style>

<svelte:window
	on:click={(e) => {
		!e.target.getAttribute('belongs') || e.target.getAttribute('belongs') != id ? reset() : ''
	}} />
<main {style} belongs={id}>
	<div belongs={id} class="button" on:click={() => (open = !open)}>

		<svg
			belongs={id}
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			viewBox="0 0 512 512">
			<rect
				belongs={id}
				x="48"
				y="80"
				width="416"
				height="384"
				rx="48"
				ry="48"
				style="fill:none;stroke:#333;stroke-linejoin:round;stroke-width:32px" />
			<path
				belongs={id}
				d="M397.82,80H114.18C77.69,80,48,110.15,48,147.2V208H64c0-16,16-32,32-32H416c16,0,32,16,32,32h16V147.2C464,110.15,434.31,80,397.82,80Z" />
			<circle belongs={id} cx="296" cy="232" r="24" />
			<circle belongs={id} cx="376" cy="232" r="24" />
			<circle belongs={id} cx="296" cy="312" r="24" />
			<circle belongs={id} cx="376" cy="312" r="24" />
			<circle belongs={id} cx="136" cy="312" r="24" />
			<circle belongs={id} cx="216" cy="312" r="24" />
			<circle belongs={id} cx="136" cy="392" r="24" />
			<circle belongs={id} cx="216" cy="392" r="24" />
			<circle belongs={id} cx="296" cy="392" r="24" />
			<line
				belongs={id}
				x1="128"
				y1="48"
				x2="128"
				y2="80"
				style="fill:none;stroke:#333;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px" />
			<line
				belongs={id}
				x1="384"
				y1="48"
				x2="384"
				y2="80"
				style="fill:none;stroke:#333;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px" />
		</svg>
		<span class="date" belongs={id}>{getDate(value, false)}</span>

		<!-- 		{d} de {months[m]} del {y} -->
	</div>
	{#if open == true}
		<div belongs={id} class="calendar" transition:scale>
			<h4 belongs={id} class="month">
				<svg
					belongs={id}
					on:click={substract}
					class="flip"
					xmlns="http://www.w3.org/2000/svg"
					width="28"
					height="28"
					viewBox="0 0 512 512">
					<polyline
						belongs={id}
						points="262.62 336 342 256 262.62 176"
						style="fill:none;stroke:#333;stroke-linecap:round;stroke-linejoin:round;stroke-width:40px" />
					<line
						belongs={id}
						x1="330.97"
						y1="256"
						x2="170"
						y2="256"
						style="fill:none;stroke:#333;stroke-linecap:round;stroke-linejoin:round;stroke-width:40px" />
					<path
						belongs={id}
						d="M256,448c106,0,192-86,192-192S362,64,256,64,64,150,64,256,150,448,256,448Z"
						style="fill:none;stroke:#333;stroke-miterlimit:10;stroke-width:40px" />
				</svg>
				<span belongs={id} class="month-text">
					<span
						class="month-text"
						belongs={id}
						on:click={(e) => (monthPicker = !monthPicker)}>
						{months[m]}
					</span>
					-
					<span
						class="year-text"
						on:keydown={handleKey}
						contenteditable
						belongs={id}
						on:blur={check}>
						{y}
					</span>
				</span>
				<svg
					belongs={id}
					on:click={add}
					xmlns="http://www.w3.org/2000/svg"
					width="28"
					height="28"
					viewBox="0 0 512 512">
					<polyline
						belongs={id}
						points="262.62 336 342 256 262.62 176"
						style="fill:none;stroke:#333;stroke-linecap:round;stroke-linejoin:round;stroke-width:40px" />
					<line
						belongs={id}
						x1="330.97"
						y1="256"
						x2="170"
						y2="256"
						style="fill:none;stroke:#333;stroke-linecap:round;stroke-linejoin:round;stroke-width:40px" />
					<path
						belongs={id}
						d="M256,448c106,0,192-86,192-192S362,64,256,64,64,150,64,256,150,448,256,448Z"
						style="fill:none;stroke:#333;stroke-miterlimit:10;stroke-width:40px" />
				</svg>
			</h4>
			{#if monthPicker == false}
				{#each days as wd}
					<span belongs={id} class="weekday">{wd}</span>
				{/each}
				{#each Array(offset(m, y))
					.fill()
					.map((e, i) => prevOffset + i) as day, i}
					<span class:fade belongs={id} class="day disabled">{day + 1}</span>
				{/each}
				{#each Array(daysInMonth(m, y)) as _, day}
					<span
						class:fade
						belongs={id}
						class="day {day + 1 == d ? 'selected' : ''}"
						on:click={(e) => selection(day + 1)}>
						{day + 1}
					</span>
				{/each}
				{#each Array(tail) as _, day}
					<span class:fade belongs={id} class="day disabled">{day + 1}</span>
				{/each}
			{:else}
				<div belongs={id} class="month-picker">
					{#each shortMonths as month, i}
						<span
							on:click={(e) => {
								m = i
								monthPicker = false
							}}
							belongs={id}
							class="month-element {i == m ? 'selected' : ''}">
							{month}
						</span>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</main>
