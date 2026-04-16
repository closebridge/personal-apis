import { Env } from '..';
import { type BlogFormat } from '../blog/blogFormat';

export async function getDataFromDb(env: Env, kind: 'blog') {
	const result = await env.personal_api.prepare(`SELECT * FROM Blog`).all();
	return result ?? false;
}

export async function entryExistence(env: Env, id: number) {
	const result = await env.personal_api.prepare(`SELECT * FROM Blog WHERE PostId = ?`).bind(id).all();
	return result.results.length > 0;
}

// lazy on undefined so null them
function prepareValue(value: any): any {
	return value === undefined ? '' : value;
}

function getTimestamp(data: BlogFormat): number {
	return data.Timestamp === undefined ? Date.now() : data.Timestamp;
}

export async function updateDb(env: Env, postId: number, data: BlogFormat, kind: 'blog'): Promise<boolean> {
	const result = await env.personal_api
		.prepare(
			`UPDATE Blog SET
				Timestamp = ?,
				Tags = ?,
				Creator = ?,
				Title = ?,
				Body = ?,
				Location = ?
			WHERE PostId = ?`,
		)
		.bind(
			prepareValue(getTimestamp(data)),
			prepareValue(data.Tags),
			prepareValue(data.Creator),
			prepareValue(data.Title),
			prepareValue(data.Body),
			prepareValue(data.Location),
			postId,
		)
		.run();
	return result.success;
}

export async function deleteFromDb(env: Env, postId: number, kind: 'blog'): Promise<boolean> {
	const result = await env.personal_api.prepare(`DELETE FROM Blog WHERE PostId = ?`).bind(postId).run();
	return result.success;
}

export async function insertIntoDb(env: Env, data: BlogFormat, kind: 'blog'): Promise<boolean> {
	const result = await env.personal_api
		.prepare(
			`INSERT INTO Blog (
				Timestamp,
				Tags,
				Creator,
				Title,
				Body,
				Location
			) VALUES (?, ?, ?, ?, ?, ?)`,
		)
		.bind(
			prepareValue(getTimestamp(data)),
			prepareValue(data.Tags),
			prepareValue(data.Creator),
			prepareValue(data.Title),
			prepareValue(data.Body),
			prepareValue(data.Location),
		)
		.run();
	return result.success;
}
