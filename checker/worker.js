const fallback = {
	lastUpdated: 'never',
	uptime: '0.00',
	todayUptime: '0.00',
	incidentFree: 0,
	meanResponse: 0,
	activeIncidents: [],
	incidentHistory: [],
	groups: []
};

export default {
	async scheduled(event, env, ctx) {
		ctx.waitUntil(checkMonitors(env));
	},

	async fetch(request, env) {
		const url = new URL(request.url);
		if (url.pathname === '/api/status') {
			return Response.json(await getStatusData(env), {
				headers: {
					'cache-control': 'public, max-age=30',
					'access-control-allow-origin': '*'
				}
			});
		}
		return new Response('Scii Status checker', {
			headers: { 'content-type': 'text/plain;charset=UTF-8' }
		});
	}
};

async function getStatusData(env) {
	try {
		const object = await env.R2_BUCKET.get('status.json');
		if (object) return await object.json();
	} catch (error) {
		console.error('R2 read error:', error.message);
	}
	return fallback;
}

async function loadMonitors(env) {
	if (env.MONITORS_JSON) {
		const config = JSON.parse(env.MONITORS_JSON);
		return Array.isArray(config) ? config : config.monitors || [];
	}

	if (!env.MONITORS_URL) return [];
	const response = await fetch(env.MONITORS_URL);
	if (!response.ok) {
		console.error('Failed to fetch monitors.json:', response.status);
		return [];
	}
	const config = await response.json();
	return Array.isArray(config) ? config : config.monitors || [];
}

async function fetchIncidents(env) {
	const repo = env.GITHUB_REPO;
	const token = env.GITHUB_TOKEN;
	if (!repo || !token) return { activeIncidents: [], incidentHistory: [] };

	try {
		const headers = {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github+json',
			'User-Agent': 'scii-status'
		};

		const [openRes, closedRes] = await Promise.all([
			fetch(
				`https://api.github.com/repos/${repo}/issues?labels=incident&state=open&per_page=10&sort=created&direction=desc`,
				{ headers }
			),
			fetch(
				`https://api.github.com/repos/${repo}/issues?labels=incident&state=closed&per_page=5&sort=updated&direction=desc`,
				{ headers }
			)
		]);

		const formatIssue = (issue) => ({
			number: issue.number,
			title: issue.title,
			body: issue.body ? issue.body.substring(0, 500) : '',
			url: issue.html_url,
			createdAt: issue.created_at,
			state: issue.state,
			...(issue.closed_at ? { closedAt: issue.closed_at } : {})
		});

		const active = openRes.ok
			? (await openRes.json()).filter((i) => !i.pull_request).map(formatIssue)
			: [];
		const history = closedRes.ok
			? (await closedRes.json()).filter((i) => !i.pull_request).map(formatIssue)
			: [];

		return { activeIncidents: active, incidentHistory: history };
	} catch (error) {
		console.error('Failed to fetch incidents:', error.message);
		return { activeIncidents: [], incidentHistory: [] };
	}
}

async function checkMonitors(env) {
	try {
		const monitors = await loadMonitors(env);
		if (monitors.length === 0) {
			console.log('No monitors configured');
			return;
		}

		let existingData = { groups: [] };
		try {
			const object = await env.R2_BUCKET.get('status.json');
			if (object) existingData = await object.json();
		} catch (error) {
			console.error('Failed to read existing status:', error.message);
		}

		const historyMap = {};
		const statsMap = {};
		for (const group of existingData.groups || []) {
			for (const service of group.services || []) {
				if (Array.isArray(service.history)) historyMap[service.name] = service.history;
				statsMap[service.name] = {
					totalChecks: service.totalChecks || 0,
					totalUp: service.totalUp || 0,
					dayChecks: service.dayChecks || 0,
					dayUp: service.dayUp || 0,
					lastDate: service.lastDate || null
				};
			}
		}

		const now = new Date();
		const today = now.toISOString().split('T')[0];

		const results = await Promise.all(
			monitors.map(async (monitor) => {
				const start = Date.now();
				const name = monitor.name || monitor.id || 'unknown';
				const stats = statsMap[name] || {
					totalChecks: 0,
					totalUp: 0,
					dayChecks: 0,
					dayUp: 0,
					lastDate: null
				};

				let up = false;
				let ms = 0;
				try {
					const response = await fetch(monitor.url, {
						method: 'GET',
						cf: { cacheTtl: 0, cacheEverything: false },
						signal: AbortSignal.timeout(10_000)
					});
					ms = Date.now() - start;
					up = response.ok;
				} catch (error) {
					console.log('Check failed for', name, ':', error.message);
				}

				const history = [...(historyMap[name] || []), up ? 1 : 0].slice(-90);
				const totalChecks = stats.totalChecks + 1;
				const totalUp = stats.totalUp + (up ? 1 : 0);
				const dayChecks = stats.lastDate === today ? stats.dayChecks + 1 : 1;
				const dayUp = stats.lastDate === today ? stats.dayUp + (up ? 1 : 0) : up ? 1 : 0;

				return {
					name,
					url: monitor.url.replace(/^https?:\/\//, ''),
					up,
					ms,
					history,
					totalChecks,
					totalUp,
					dayChecks,
					dayUp,
					lastDate: today,
					lastChecked: now.toISOString()
				};
			})
		);

		const upCount = results.filter((result) => result.up).length;
		const meanResponse =
			results.length > 0
				? Math.round(results.reduce((sum, result) => sum + result.ms, 0) / results.length)
				: 0;
		const totalChecks = results.reduce((sum, result) => sum + result.totalChecks, 0);
		const totalUp = results.reduce((sum, result) => sum + result.totalUp, 0);
		const dayChecks = results.reduce((sum, result) => sum + result.dayChecks, 0);
		const dayUp = results.reduce((sum, result) => sum + result.dayUp, 0);

		const { activeIncidents, incidentHistory } = await fetchIncidents(env);
		let incidentFree = 0;
		if (incidentHistory.length > 0) {
			const lastClosed = new Date(incidentHistory[0].closedAt || incidentHistory[0].createdAt);
			incidentFree = Math.floor((Date.now() - lastClosed.getTime()) / (1000 * 60 * 60 * 24));
		}

		const statusData = {
			lastUpdated: now.toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				hour12: true
			}),
			lastUpdatedISO: now.toISOString(),
			uptime: totalChecks > 0 ? ((totalUp / totalChecks) * 100).toFixed(2) : '100.00',
			todayUptime: dayChecks > 0 ? ((dayUp / dayChecks) * 100).toFixed(2) : '100.00',
			incidentFree,
			meanResponse,
			activeIncidents,
			incidentHistory,
			groups: [
				{
					name: env.GROUP_NAME || 'Wayfield Status',
					services: results
				}
			]
		};

		await env.R2_BUCKET.put('status.json', JSON.stringify(statusData));
		console.log('Status updated:', upCount + '/' + results.length, 'services up');
	} catch (error) {
		console.error('Monitor check failed:', error.message, error.stack);
	}
}
