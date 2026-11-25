<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { PageShell } from '../lib/ui';
	import ServiceRow from '../lib/components/ServiceRow.svelte';
	import type { StatusData } from '../lib/types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// svelte-ignore state_referenced_locally
	let status = $state<StatusData>(data.status);
	let refreshing = $state(false);

	const site = $derived(data.site);
	const github = 'https://github.com/WayfieldLabs/Scii-Status';

	const services = $derived(status.groups.flatMap((group) => group.services));
	const upCount = $derived(services.filter((service) => service.up).length);
	const activeCount = $derived(status.activeIncidents.length);
	const tone = $derived(
		activeCount > 0
			? 'warning'
			: services.length === 0
				? 'unknown'
				: upCount === services.length
					? 'ok'
					: 'danger'
	);
	const headline = $derived(
		activeCount > 0
			? activeCount === 1
				? 'Active incident'
				: 'Active incidents'
			: services.length === 0
				? 'Waiting for first check'
				: upCount === services.length
					? 'All systems operational'
					: `${services.length - upCount} service${services.length - upCount === 1 ? '' : 's'} down`
	);

	onMount(() => {
		const id = setInterval(refresh, 60_000);
		return () => clearInterval(id);
	});

	async function refresh() {
		refreshing = true;
		try {
			const response = await fetch('/api/status', { headers: { accept: 'application/json' } });
			if (response.ok) status = (await response.json()) as StatusData;
		} catch {
			// Keep the last known status.
		} finally {
			refreshing = false;
		}
	}

	function dateLabel(value: string | undefined) {
		if (!value) return '';
		return new Date(value).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>{site.name} · Live status</title>
	<meta
		name="description"
		content={`Live status, uptime, and incident history for ${site.groupName}. Powered by Scii Status.`}
	/>
</svelte:head>

<PageShell>
	<header class="site-header">
		<a class="brand" href={resolve('/')} aria-label={`${site.name} home`}>
			<img src="/favicon.svg" alt="" width="28" height="28" />
			<span class="brand-name">{site.name}</span>
		</a>
		<a class="github" href={github} rel="external">
			GitHub
			<span aria-hidden="true">↗</span>
		</a>
	</header>

	<main>
		<section class="hero">
			<p class="eyebrow">{site.groupName}</p>
			<div class="status-headline" class:refreshing>
				<span class="status-dot {tone}" aria-hidden="true"></span>
				<h1>{headline}</h1>
			</div>
			<p class="lede">
				{services.length === 0
					? 'The first check has not finished yet. This page refreshes automatically.'
					: `Live uptime and incident history for ${site.groupName}. Last checked ${status.lastUpdated}.`}
			</p>

			<div class="metrics" aria-label="Status summary">
				<div>
					<span>Overall uptime</span>
					<strong>{status.uptime}%</strong>
				</div>
				<div>
					<span>Today</span>
					<strong>{status.todayUptime}%</strong>
				</div>
				<div>
					<span>Mean response</span>
					<strong>{status.meanResponse}<small>ms</small></strong>
				</div>
				<div>
					<span>Services</span>
					<strong>{upCount}<small>/{services.length}</small></strong>
				</div>
			</div>
		</section>

		{#if status.activeIncidents.length > 0}
			<section class="incident-banner" aria-label="Active incidents">
				<p class="eyebrow">Active</p>
				{#each status.activeIncidents as incident (incident.number)}
					<a href={incident.url} rel="external">
						<strong>{incident.title}</strong>
						{#if incident.body}<span>{incident.body}</span>{/if}
						<small>{dateLabel(incident.createdAt)} · View incident ↗</small>
					</a>
				{/each}
			</section>
		{/if}

		<section class="block" aria-labelledby="services-heading">
			<div class="block-head">
				<h2 id="services-heading">Services</h2>
				<span>{upCount} of {services.length} operational</span>
			</div>

			{#if services.length > 0}
				<div class="service-list">
					{#each services as service (service.name)}
						<ServiceRow {service} />
					{/each}
				</div>
			{:else}
				<div class="empty">
					<span class="status-dot unknown" aria-hidden="true"></span>
					<p>Waiting for the first monitor check. Check back in a minute.</p>
				</div>
			{/if}
		</section>

		{#if status.incidentHistory.length > 0}
			<section class="block" aria-labelledby="history-heading">
				<div class="block-head">
					<h2 id="history-heading">Incident history</h2>
					<span>{status.incidentFree} days since the last incident</span>
				</div>

				<div class="history">
					{#each status.incidentHistory as incident (incident.number)}
						<a class="history-row" href={incident.url} rel="external">
							<span class="history-date">{dateLabel(incident.closedAt ?? incident.createdAt)}</span>
							<strong>{incident.title}</strong>
							<span class="history-state">Resolved</span>
						</a>
					{/each}
				</div>
			</section>
		{/if}
	</main>

	<footer class="site-footer">
		<span class="footer-brand">{site.name}</span>
		<span>
			Powered by <a href={github} rel="external">Scii Status</a>
			· <a href={site.url} rel="external">Wayfield</a>
		</span>
		<a href={`mailto:${site.contactEmail}`} rel="external">{site.contactEmail}</a>
	</footer>
</PageShell>

<style>
	.site-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		min-height: 88px;
		border-bottom: 1px solid var(--wf-line);
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 10px;
	}

	.brand-name {
		font-family: var(--wf-font-display);
		font-size: 17px;
		font-weight: 600;
		letter-spacing: -0.01em;
		line-height: 1.1;
	}

	.github {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		color: var(--wf-ink-soft);
		font-family: var(--wf-font-ui);
		font-size: 12px;
		font-weight: 500;
	}

	.hero {
		padding: 64px 0 48px;
		border-bottom: 1px solid var(--wf-line);
	}

	.eyebrow {
		color: var(--wf-muted);
		font-family: var(--wf-font-ui);
		font-size: 10px;
		font-weight: 500;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.status-headline {
		display: flex;
		align-items: center;
		gap: 14px;
		margin-top: 14px;
		transition: opacity 160ms ease;
	}

	.status-headline.refreshing {
		opacity: 0.55;
	}

	.status-dot {
		flex: none;
		width: 12px;
		height: 12px;
		border-radius: 999px;
		background: var(--wf-muted);
		box-shadow: 0 0 0 4px var(--wf-surface-soft);
	}

	.status-dot.ok {
		background: var(--wf-success);
		box-shadow: 0 0 0 4px var(--wf-success-soft);
	}

	.status-dot.warning {
		background: var(--wf-warning);
		box-shadow: 0 0 0 4px var(--wf-warning-soft);
	}

	.status-dot.danger {
		background: var(--wf-danger);
		box-shadow: 0 0 0 4px var(--wf-danger-soft);
	}

	h1 {
		font-family: var(--wf-font-display);
		font-size: clamp(34px, 5vw, 56px);
		font-weight: 600;
		letter-spacing: -0.045em;
		line-height: 1.02;
	}

	.lede {
		max-width: 58ch;
		margin-top: 14px;
		color: var(--wf-muted);
		font-size: 14px;
		line-height: 1.6;
	}

	.metrics {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		margin-top: 36px;
		border: 1px solid var(--wf-line);
		border-radius: 14px;
		background: var(--wf-surface);
	}

	.metrics div {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 18px;
		border-right: 1px solid var(--wf-line);
	}

	.metrics div:last-child {
		border-right: 0;
	}

	.metrics span {
		color: var(--wf-muted);
		font-family: var(--wf-font-ui);
		font-size: 9px;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.metrics strong {
		font-family: var(--wf-font-display);
		font-size: 24px;
		font-weight: 500;
		letter-spacing: -0.03em;
	}

	.metrics strong small {
		margin-left: 2px;
		color: var(--wf-muted);
		font-family: var(--wf-font-body);
		font-size: 12px;
		font-weight: 400;
		letter-spacing: 0;
	}

	.incident-banner {
		margin-top: 32px;
		padding: 20px;
		border: 1px solid color-mix(in srgb, var(--wf-warning) 25%, var(--wf-line));
		border-left: 3px solid var(--wf-warning);
		border-radius: 12px;
		background: var(--wf-warning-soft);
	}

	.incident-banner a {
		display: grid;
		gap: 4px;
		margin-top: 8px;
	}

	.incident-banner strong {
		font-family: var(--wf-font-ui);
		font-size: 14px;
		font-weight: 500;
	}

	.incident-banner span {
		color: var(--wf-ink-soft);
		font-size: 13px;
		line-height: 1.55;
		white-space: pre-line;
	}

	.incident-banner small {
		color: var(--wf-muted);
		font-size: 11px;
	}

	.block {
		padding: 40px 0;
		border-bottom: 1px solid var(--wf-line);
	}

	.block-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 8px;
	}

	h2 {
		font-family: var(--wf-font-display);
		font-size: 22px;
		font-weight: 600;
		letter-spacing: -0.03em;
	}

	.block-head span {
		color: var(--wf-muted);
		font-family: var(--wf-font-ui);
		font-size: 11px;
	}

	.service-list {
		margin-top: 4px;
	}

	.empty {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 28px 0;
		color: var(--wf-muted);
	}

	.empty p {
		font-size: 13px;
	}

	.history {
		display: grid;
		margin-top: 4px;
	}

	.history-row {
		display: grid;
		grid-template-columns: 110px minmax(0, 1fr) auto;
		gap: 16px;
		align-items: center;
		padding: 14px 0;
		border-bottom: 1px solid var(--wf-line);
	}

	.history-date {
		color: var(--wf-muted);
		font-family: var(--wf-font-ui);
		font-size: 11px;
	}

	.history-row strong {
		font-family: var(--wf-font-ui);
		font-size: 13px;
		font-weight: 500;
	}

	.history-state {
		color: var(--wf-success);
		font-family: var(--wf-font-ui);
		font-size: 10px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.site-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 12px;
		padding: 28px 0;
		color: var(--wf-muted);
		font-family: var(--wf-font-ui);
		font-size: 11px;
	}

	.footer-brand {
		color: var(--wf-ink);
		font-family: var(--wf-font-display);
		font-size: 14px;
		font-weight: 600;
	}

	.site-footer a {
		color: var(--wf-ink-soft);
	}

	@media (max-width: 720px) {
		.site-header {
			min-height: 72px;
		}

		.hero {
			padding: 44px 0 36px;
		}

		.metrics {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.metrics div:nth-child(2) {
			border-right: 0;
		}

		.metrics div:nth-child(-n + 2) {
			border-bottom: 1px solid var(--wf-line);
		}

		.history-row {
			grid-template-columns: 1fr auto;
			gap: 4px 12px;
		}

		.history-date {
			grid-column: 1 / -1;
		}

		.site-footer {
			align-items: flex-start;
			flex-direction: column;
		}
	}
</style>
