// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface Platform {
			env: {
				R2_BUCKET: R2Bucket;
				SITE_NAME?: string;
				SITE_URL?: string;
				GROUP_NAME?: string;
				CONTACT_EMAIL?: string;
				SOURCE_URL?: string;
				ACCENT_COLOR?: string;
				ACCENT_COLOR_DARK?: string;
			};
		}
	}
}

export {};
