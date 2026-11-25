<script lang="ts">
	import type { ServiceStatus } from '../types';

	let { service }: { service: ServiceStatus } = $props();

	const uptime = $derived(
		service.totalChecks > 0 ? ((service.totalUp / service.totalChecks) * 100).toFixed(1) : '—'
	);
	const bars = $derived([
		...Array.from({ length: Math.max(0, 90 - service.history.length) }, () => null),
		...service.history
	]);
</script>

<article class="service">
	<span class="dot" class:down={!service.up} aria-label={service.up ? 'Operational' : 'Down'}
	></span>

	<div class="identity">
		<strong>{service.name}</strong>
		<span>{service.url}</span>
	</div>

	<div class="bars" aria-label="Last 90 checks">
		{#each bars as bar, index (index)}
			<span class:up={bar === 1} class:down={bar === 0}></span>
		{/each}
	</div>

	<span class="uptime">{uptime}%</span>
	<span class="response">{service.ms} ms</span>
</article>

<style>
	.service {
		display: grid;
		grid-template-columns: 10px minmax(0, 1fr) minmax(150px, 240px) 58px 64px;
		gap: 16px;
		align-items: center;
		padding: 16px 0;
		border-bottom: 1px solid var(--wf-line);
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 999px;
		background: var(--wf-success);
		box-shadow: 0 0 0 3px var(--wf-success-soft);
	}

	.dot.down {
		background: var(--wf-danger);
		box-shadow: 0 0 0 3px var(--wf-danger-soft);
	}

	.identity {
		display: flex;
		min-width: 0;
		flex-direction: column;
		gap: 1px;
	}

	.identity strong {
		font-family: var(--wf-font-ui);
		font-size: 14px;
		font-weight: 500;
	}

	.identity span {
		overflow: hidden;
		color: var(--wf-muted);
		font-family: var(--wf-font-body);
		font-size: 11px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.bars {
		display: flex;
		align-items: end;
		gap: 2px;
		height: 22px;
	}

	.bars span {
		flex: 1;
		height: 10px;
		border-radius: 1px;
		background: var(--wf-line);
	}

	.bars span.up {
		height: 18px;
		background: var(--wf-success);
	}

	.bars span.down {
		height: 18px;
		background: var(--wf-danger);
	}

	.uptime {
		color: var(--wf-ink-soft);
		font-family: var(--wf-font-ui);
		font-size: 12px;
		font-weight: 500;
		text-align: right;
	}

	.response {
		color: var(--wf-muted);
		font-family: var(--wf-font-body);
		font-size: 11px;
		text-align: right;
	}

	@media (max-width: 720px) {
		.service {
			grid-template-columns: 10px minmax(0, 1fr) auto;
			gap: 10px;
		}

		.bars {
			grid-column: 1 / -1;
			height: 16px;
		}

		.bars span {
			height: 7px;
		}

		.bars span.up,
		.bars span.down {
			height: 14px;
		}

		.response {
			display: none;
		}
	}
</style>
