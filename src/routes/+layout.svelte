<script lang="ts">
	import '../lib/design/tokens.css';
	import '../app.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<title>Scii Status</title>
	<meta
		name="description"
		content="Live status, uptime, and incident history for Wayfield services."
	/>
</svelte:head>

{@render children()}
