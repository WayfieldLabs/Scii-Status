import { env } from 'cloudflare:workers';
import { emptyStatus, type StatusData } from '../types';

export async function getStatusData(): Promise<StatusData> {
	const bucket = env.R2_BUCKET;
	if (!bucket) return emptyStatus;

	try {
		const object = await bucket.get('status.json');
		if (!object) return emptyStatus;
		const text = (await object.text()).replace(/^\uFEFF/, '');
		const data = JSON.parse(text) as Partial<StatusData>;
		return normalize(data);
	} catch (error) {
		console.error('Could not read status.json:', error);
		return emptyStatus;
	}
}

function normalize(data: Partial<StatusData>): StatusData {
	return {
		lastUpdated: data.lastUpdated ?? 'never',
		uptime: data.uptime ?? '0.00',
		todayUptime: data.todayUptime ?? '0.00',
		incidentFree: data.incidentFree ?? 0,
		meanResponse: data.meanResponse ?? 0,
		activeIncidents: data.activeIncidents ?? [],
		incidentHistory: data.incidentHistory ?? [],
		groups: (data.groups ?? []).map((group) => ({
			name: group.name,
			services: (group.services ?? []).map((service) => ({
				name: service.name,
				url: service.url,
				up: Boolean(service.up),
				ms: service.ms ?? 0,
				history: Array.isArray(service.history) ? service.history.slice(-90) : [],
				totalChecks: service.totalChecks ?? 0,
				totalUp: service.totalUp ?? 0,
				dayChecks: service.dayChecks ?? 0,
				dayUp: service.dayUp ?? 0,
				lastDate: service.lastDate ?? null,
				lastChecked: service.lastChecked ?? null
			}))
		}))
	};
}
