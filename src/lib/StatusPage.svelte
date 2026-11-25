<script lang="ts">
	import type { SiteConfig, StatusData } from './types';
	import { bars, dateLabel, uptime } from './format';

	let {
		status,
		site,
		theme = 'auto'
	}: {
		status: StatusData;
		site: SiteConfig;
		theme?: 'auto' | 'light' | 'dark';
	} = $props();

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
</script>

<div
	class="signal"
	class:force-light={theme === 'light'}
	class:force-dark={theme === 'dark'}
	style="--signal-accent-light: {site.accentLight}; --signal-accent-dark: {site.accentDark}"
>
	<div class="inner">
		<header class="header">
			<span class="brand">{site.name.toLowerCase()}</span>
			<span class="header-group">{site.groupName}</span>
			{#if site.sourceUrl}
				<a href={site.sourceUrl} rel="external">GitHub ↗</a>
			{/if}
		</header>

		<section class="hero">
			<div class="hero-copy">
				<p class="eyebrow">Live status</p>
				<h1><span class="dot {tone}" aria-hidden="true"></span>{headline}</h1>
				<p class="meta">
					Last checked {status.lastUpdated} · {upCount}/{services.length} services up
				</p>

				<div class="stats">
					<div><span>Uptime</span><strong>{status.uptime}%</strong></div>
					<div><span>Today</span><strong>{status.todayUptime}%</strong></div>
					<div><span>Response</span><strong>{status.meanResponse}<small>ms</small></strong></div>
					<div><span>Incident-free</span><strong>{status.incidentFree}<small>days</small></strong></div>
				</div>
			</div>

			<div class="gauge" style="--value: {status.uptime}">
				<div class="gauge-inner">
					<strong>{status.uptime}%</strong>
					<span>overall uptime</span>
				</div>
			</div>
		</section>

		{#if status.activeIncidents.length > 0}
			<section class="incident-banner">
				<p class="eyebrow">Active incident</p>
				{#each status.activeIncidents as incident (incident.number)}
					<a href={incident.url} rel="external">
						<strong>{incident.title}</strong>
						<span>{incident.body}</span>
					</a>
				{/each}
			</section>
		{/if}

		<section class="services">
			<div class="section-head">
				<h2>Services</h2>
				<span>{upCount} of {services.length} operational</span>
			</div>

			{#each services as service (service.name)}
				<div class="row">
					<span class="dot {service.up ? 'ok' : 'danger'}" aria-hidden="true"></span>
					<div class="identity">
						<strong>{service.name}</strong>
						<span>{service.url}</span>
					</div>
					<div class="bars" aria-label="Last 90 checks">
						{#each bars(service) as bar, index (index)}
							<i class:up={bar === 1} class:down={bar === 0}></i>
						{/each}
					</div>
					<span class="pct">{uptime(service)}%</span>
					<span class="ms">{service.ms} ms</span>
				</div>
			{/each}
		</section>

		{#if status.incidentHistory.length > 0}
			<section class="history">
				<div class="section-head">
					<h2>Incident history</h2>
					<span>{status.incidentFree} days since the last incident</span>
				</div>
				{#each status.incidentHistory as incident (incident.number)}
					<a class="history-row" href={incident.url} rel="external">
						<span>{dateLabel(incident.closedAt ?? incident.createdAt)}</span>
						<strong>{incident.title}</strong>
						<em>Resolved</em>
					</a>
				{/each}
			</section>
		{/if}

		<footer class="footer">
			<span>{site.name}</span>
			{#if site.sourceUrl}
				<span>Powered by <a href={site.sourceUrl} rel="external">Scii Status</a></span>
			{:else}
				<span>Powered by Scii Status</span>
			{/if}
			<a href={`mailto:${site.contactEmail}`} rel="external">{site.contactEmail}</a>
		</footer>
	</div>
</div>

<style>
	.signal {
		--bg: light-dark(var(--wf-bg), #0b0d10);
		--text: light-dark(var(--wf-ink), #f4f1e8);
		--muted: light-dark(var(--wf-muted), #888f99);
		--line: light-dark(var(--wf-line), rgba(255, 255, 255, 0.09));
		--green: light-dark(
			var(--signal-accent-light, var(--wf-success)),
			var(--signal-accent-dark, #4ade80)
		);
		--amber: light-dark(var(--wf-warning), #fbbf24);
		--red: light-dark(var(--wf-danger), #f87171);
		--ring: light-dark(var(--wf-surface-soft), rgba(255, 255, 255, 0.06));
		--bar-idle: light-dark(var(--wf-line), rgba(255, 255, 255, 0.08));
		--banner-bg: light-dark(var(--wf-warning-soft), rgba(251, 191, 36, 0.06));
		--banner-line: light-dark(
			color-mix(in srgb, var(--wf-warning) 25%, var(--wf-line)),
			rgba(251, 191, 36, 0.24)
		);

		color-scheme: light dark;
		min-height: 100vh;
		background: var(--bg);
		color: var(--text);
		font-family: var(--wf-font-body);
	}

	.signal.force-light {
		color-scheme: light;
	}

	.signal.force-dark {
		color-scheme: dark;
	}

	.inner {
		width: min(100% - 48px, 1080px);
		margin: 0 auto;
	}

	.header {
		display: flex;
		align-items: center;
		gap: 20px;
		height: 72px;
		border-bottom: 1px solid var(--line);
		color: var(--muted);
		font-family: var(--wf-font-ui);
		font-size: 11px;
	}

	.brand {
		color: var(--text);
		font-family: var(--wf-font-display);
		font-size: 16px;
		font-weight: 600;
		letter-spacing: 0.02em;
	}

	.header-group {
		margin-left: auto;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.header a {
		color: var(--muted);
	}

	.header a:hover {
		color: var(--text);
	}

	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 48px;
		align-items: center;
		padding: 64px 0 56px;
		border-bottom: 1px solid var(--line);
	}

	.eyebrow {
		color: var(--muted);
		font-family: var(--wf-font-ui);
		font-size: 9px;
		font-weight: 500;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	h1 {
		display: flex;
		align-items: center;
		gap: 14px;
		margin-top: 12px;
		font-family: var(--wf-font-display);
		font-size: clamp(34px, 4.6vw, 54px);
		font-weight: 500;
		letter-spacing: -0.045em;
		line-height: 1;
	}

	.dot {
		flex: none;
		width: 10px;
		height: 10px;
		border-radius: 999px;
		background: var(--muted);
		box-shadow: 0 0 0 4px var(--ring);
	}

	.dot.ok {
		background: var(--green);
		box-shadow: 0 0 18px color-mix(in srgb, var(--green) 45%, transparent);
	}

	.dot.warning {
		background: var(--amber);
		box-shadow: 0 0 18px color-mix(in srgb, var(--amber) 38%, transparent);
	}

	.dot.danger {
		background: var(--red);
		box-shadow: 0 0 18px color-mix(in srgb, var(--red) 38%, transparent);
	}

	.meta {
		margin-top: 12px;
		color: var(--muted);
		font-size: 12px;
	}

	.stats {
		display: flex;
		flex-wrap: wrap;
		gap: 28px;
		margin-top: 34px;
	}

	.stats div {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding-right: 28px;
		border-right: 1px solid var(--line);
	}

	.stats div:last-child {
		padding-right: 0;
		border-right: 0;
	}

	.stats span {
		color: var(--muted);
		font-family: var(--wf-font-ui);
		font-size: 9px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.stats strong {
		font-family: var(--wf-font-display);
		font-size: 22px;
		font-weight: 500;
		letter-spacing: -0.03em;
	}

	.stats small {
		margin-left: 2px;
		color: var(--muted);
		font-family: var(--wf-font-body);
		font-size: 10px;
		font-weight: 400;
		letter-spacing: 0;
	}

	.gauge {
		--pct: calc(var(--value) * 1%);
		display: grid;
		place-items: center;
		width: 190px;
		height: 190px;
		border-radius: 50%;
		background: conic-gradient(var(--green) var(--pct), var(--bar-idle) 0);
		position: relative;
	}

	.gauge::before {
		content: '';
		position: absolute;
		inset: 10px;
		border-radius: 50%;
		background: var(--bg);
		border: 1px solid var(--line);
	}

	.gauge-inner {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}

	.gauge-inner strong {
		font-family: var(--wf-font-display);
		font-size: 30px;
		font-weight: 500;
		letter-spacing: -0.04em;
	}

	.gauge-inner span {
		color: var(--muted);
		font-family: var(--wf-font-ui);
		font-size: 8px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.incident-banner {
		margin-top: 24px;
		padding: 16px 20px;
		border: 1px solid var(--banner-line);
		border-left: 3px solid var(--amber);
		border-radius: 8px;
		background: var(--banner-bg);
	}

	.incident-banner a {
		display: grid;
		gap: 4px;
		margin-top: 6px;
	}

	.incident-banner strong {
		font-family: var(--wf-font-ui);
		font-size: 13px;
	}

	.incident-banner span {
		color: var(--muted);
		font-size: 12px;
	}

	.services,
	.history {
		padding: 34px 0;
		border-bottom: 1px solid var(--line);
	}

	.section-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 10px;
	}

	h2 {
		font-family: var(--wf-font-display);
		font-size: 18px;
		font-weight: 500;
		letter-spacing: -0.02em;
	}

	.section-head span {
		color: var(--muted);
		font-family: var(--wf-font-ui);
		font-size: 10px;
	}

	.row {
		display: grid;
		grid-template-columns: 10px minmax(130px, 1fr) minmax(160px, 260px) 58px 64px;
		gap: 16px;
		align-items: center;
		padding: 13px 0;
		border-bottom: 1px solid var(--line);
	}

	.row:last-child {
		border-bottom: 0;
	}

	.identity {
		display: flex;
		flex-direction: column;
	}

	.identity strong {
		font-family: var(--wf-font-ui);
		font-size: 13px;
		font-weight: 500;
	}

	.identity span {
		color: var(--muted);
		font-family: var(--wf-font-body);
		font-size: 10px;
	}

	.bars {
		display: flex;
		align-items: end;
		gap: 2px;
		height: 18px;
	}

	.bars i {
		flex: 1;
		height: 8px;
		border-radius: 1px;
		background: var(--bar-idle);
	}

	.bars i.up {
		height: 15px;
		background: var(--green);
		opacity: 0.72;
	}

	.bars i.down {
		height: 15px;
		background: var(--red);
	}

	.pct,
	.ms {
		color: var(--muted);
		font-family: var(--wf-font-ui);
		font-size: 10px;
		text-align: right;
	}

	.history-row {
		display: grid;
		grid-template-columns: 110px minmax(0, 1fr) auto;
		gap: 16px;
		padding: 12px 0;
		border-bottom: 1px solid var(--line);
		font-size: 12px;
	}

	.history-row span {
		color: var(--muted);
		font-family: var(--wf-font-ui);
		font-size: 10px;
	}

	.history-row strong {
		font-family: var(--wf-font-ui);
		font-weight: 500;
	}

	.history-row em {
		color: var(--green);
		font-family: var(--wf-font-ui);
		font-size: 9px;
		font-style: normal;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.footer {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 12px;
		padding: 26px 0;
		color: var(--muted);
		font-family: var(--wf-font-ui);
		font-size: 10px;
	}

	.footer span:first-child {
		color: var(--text);
	}

	.footer a {
		color: var(--muted);
	}

	.footer a:hover {
		color: var(--text);
	}

	@media (max-width: 760px) {
		.inner {
			width: min(100% - 36px, 1080px);
		}

		.hero {
			grid-template-columns: 1fr;
			gap: 32px;
			padding: 44px 0 40px;
		}

		.gauge {
			width: 150px;
			height: 150px;
		}

		.row {
			grid-template-columns: 10px minmax(0, 1fr) auto;
		}

		.bars {
			grid-column: 1 / -1;
		}

		.ms {
			display: none;
		}
	}
</style>
