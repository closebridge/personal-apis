import { Env } from '..';
import blogEditor from '../blog/blogEditor';
import { type BlogFormat } from '../blog/blogFormat';
import { type SecurityFormat } from '../security/securityType';

export async function getDataFromDb(env: Env, kind: 'blog' | 'totp') {
	const result = await env.personal_api
		.prepare(`SELECT * FROM ${kind == 'blog' ? 'Blog' : 'Security'} ${kind == 'totp' ? 'WHERE UsedFor = "TOTP"' : ''}`)
		.all();
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

export async function updateDb(env: Env, itemId: number, data: BlogFormat | SecurityFormat, kind: 'blog' | 'security'): Promise<boolean> {
	const blogSchema = `UPDATE Blog SET Timestamp = ?, Tags = ?, Creator = ?, Title = ?, Body = ?, Location = ? WHERE PostId = ?`;
	const securitySchema = `UPDATE Security SET Name = ?, UsedFor = ?, Type = ?, Value = ? WHERE Id = ?`;

	if (kind == 'blog') {
		const inputQueue = data as BlogFormat;

		const result = await env.personal_api
			.prepare(blogSchema)
			.bind(
				prepareValue(getTimestamp(inputQueue)),
				prepareValue(inputQueue.Tags),
				prepareValue(inputQueue.Creator),
				prepareValue(inputQueue.Title),
				prepareValue(inputQueue.Body),
				prepareValue(inputQueue.Location),
				itemId,
			)
			.run();
		return result.success;
	} else if (kind == 'security') {
		const inputQueue = data as SecurityFormat;
		const result = await env.personal_api
			.prepare(securitySchema)
			.bind(prepareValue(inputQueue.Name), prepareValue(inputQueue.UsedFor), prepareValue(inputQueue.Type), prepareValue(inputQueue.Value))
			.run();
		return result.success;
	}
	return false;
}

export async function deleteFromDb(env: Env, postId: number, kind: 'blog'): Promise<boolean> {
	const result = await env.personal_api.prepare(`DELETE FROM Blog WHERE PostId = ?`).bind(postId).run();
	return result.success;
}

export async function insertIntoDb(env: Env, data: BlogFormat | SecurityFormat, kind: 'blog' | 'security'): Promise<boolean> {
	const blogSchema: string = 'INSERT INTO Blog (Timestamp,Tags,Creator,Title,Body,Location) VALUES (?, ?, ?, ?, ?, ?)';
	const securitySchema: string = `INSERT INTO Security (Name, UsedFor, Type, Value) VALUES (?, ?, ?, ?)`;

	let result;
	if (kind === 'blog') {
		const inputQueue = data as BlogFormat;
		result = await env.personal_api
			.prepare(blogSchema)
			.bind(
				prepareValue(getTimestamp(inputQueue)),
				prepareValue(inputQueue.Tags),
				prepareValue(inputQueue.Creator),
				prepareValue(inputQueue.Title),
				prepareValue(inputQueue.Body),
				prepareValue(inputQueue.Location),
			)
			.run();
		return result.success;
	} else if (kind == 'security') {
		const inputQueue = data as SecurityFormat;
		result = await env.personal_api
			.prepare(securitySchema)
			.bind(prepareValue(inputQueue.Name), prepareValue(inputQueue.UsedFor), prepareValue(inputQueue.Type), prepareValue(inputQueue.Value))
			.run();
		return result.success;
	}
	return false;
}
