import { getStatusData } from '../lib/server/status';
import { getSiteConfig } from '../lib/server/site';

export async function load() {
	return {
		status: await getStatusData(),
		site: getSiteConfig()
	};
}
