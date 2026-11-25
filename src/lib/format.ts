import type { ServiceStatus } from './types';

export function uptime(service: ServiceStatus) {
	return service.totalChecks > 0
		? ((service.totalUp / service.totalChecks) * 100).toFixed(1)
		: '—';
}

export function bars(service: ServiceStatus, count = 90) {
	return [
		...Array.from({ length: Math.max(0, count - service.history.length) }, () => null),
		...service.history.slice(-count)
	];
}

export function dateLabel(value: string | undefined) {
	if (!value) return '';
	return new Date(value).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}
