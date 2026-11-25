import { env } from 'cloudflare:workers';
import { getStatusData } from '../lib/server/status';

export async function load() {
	return {
		status: await getStatusData(),
		site: {
			name: env.SITE_NAME ?? 'Scii Status',
			url: env.SITE_URL ?? 'https://wayfield.dev',
			groupName: env.GROUP_NAME ?? 'Status',
			contactEmail: env.CONTACT_EMAIL ?? 'hello@wayfield.dev'
		}
	};
}
