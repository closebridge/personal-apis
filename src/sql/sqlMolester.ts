import { Env } from '..';

export default async function getDataFromDb(env: Env) {
	const result = await env.personal_api.prepare('SELECT * FROM Blog').all();
	return result;
}
