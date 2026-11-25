import { json } from '@sveltejs/kit';
import { getStatusData } from '../../../lib/server/status';

export async function GET() {
	return json(await getStatusData(), {
		headers: {
			'cache-control': 'public, max-age=30'
		}
	});
}
