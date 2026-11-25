import { env } from 'cloudflare:workers';
import type { SiteConfig } from '../types';

export function getSiteConfig(): SiteConfig {
	return {
		name: env.SITE_NAME ?? 'Scii Status',
		url: env.SITE_URL ?? 'https://wayfield.dev',
		groupName: env.GROUP_NAME ?? 'Status',
		contactEmail: env.CONTACT_EMAIL ?? 'hello@wayfield.dev',
		sourceUrl: env.SOURCE_URL ?? 'https://github.com/WayfieldLabs/Scii-Status',
		accentLight: env.ACCENT_COLOR ?? '#2f7d58',
		accentDark: env.ACCENT_COLOR_DARK ?? '#4ade80'
	};
}
