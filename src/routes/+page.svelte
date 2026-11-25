<script lang="ts">
	import type { PageProps } from './$types';
	import StatusPage from '../lib/StatusPage.svelte';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.site.name} · Live status</title>
	<meta
		name="description"
		content={`Live status, uptime, and incident history for ${data.site.groupName}. Powered by Scii Status.`}
	/>
</svelte:head>

<StatusPage status={data.status} site={data.site} />
