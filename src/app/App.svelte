<script>
	// Get context from app initialization or set default context values
	export let env = {
		apiURL : 'http://localhost:3000'
	}

	// get application index
	import app from './index'

	// Set context to use in all application
	import { setContext } from 'svelte'

	// set env
	setContext('env', env);

	// set services
	setContext('services', app.services)

	// set helpers
	setContext('helpers', app.helpers)

	// config requests
	const { client } = app.services
	client.instance.defaults.baseURL = env.apiURL

	// Load router and routes
	import Router from 'svelte-spa-router'
	import routes from './routes/index'

</script>

<Router {routes}></Router>

<style>
	:global(main) {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	@media (min-width: 640px) {
		:global(main) {
			max-width: none;
		}
	}
</style>