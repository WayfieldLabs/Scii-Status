<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children?: Snippet } = $props();
</script>

<div class="wf-shell">
	<div class="wf-shell__inner">
		{@render children?.()}
	</div>
</div>

<style>
	.wf-shell {
		min-height: 100vh;
		background: var(--wf-bg);
		color: var(--wf-ink);
	}

	.wf-shell__inner {
		width: min(100% - 48px, var(--wf-page-width));
		margin: 0 auto;
	}

	@media (max-width: 620px) {
		.wf-shell__inner {
			width: min(100% - 30px, var(--wf-page-width));
		}
	}
</style>
