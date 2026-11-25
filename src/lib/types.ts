export interface ServiceStatus {
	name: string;
	url: string;
	up: boolean;
	ms: number;
	history: number[];
	totalChecks: number;
	totalUp: number;
	dayChecks: number;
	dayUp: number;
	lastDate: string | null;
	lastChecked: string | null;
}

export interface ServiceGroup {
	name: string;
	services: ServiceStatus[];
}

export interface Incident {
	number: number;
	title: string;
	body: string;
	url: string;
	createdAt: string;
	state: 'open' | 'closed';
	closedAt?: string;
}

export interface StatusData {
	lastUpdated: string;
	lastUpdatedISO?: string;
	uptime: string;
	todayUptime: string;
	incidentFree: number;
	meanResponse: number;
	activeIncidents: Incident[];
	incidentHistory: Incident[];
	groups: ServiceGroup[];
}

export const emptyStatus: StatusData = {
	lastUpdated: 'never',
	uptime: '0.00',
	todayUptime: '0.00',
	incidentFree: 0,
	meanResponse: 0,
	activeIncidents: [],
	incidentHistory: [],
	groups: []
};
