export interface Env {
	// If you set another name in the Wrangler config file for the value for 'binding',
	// replace "DB" with the variable name you defined.
	personal_api: D1Database;
	NO_SPAMMIE: RateLimit;
	MASTER_CRED: string;
}

import getBlogPosts from './blog/blogConverter';
import timeOTP from './security/timeOTP';
import { type BlogFormat, type BlogUpdate } from './blog/blogFormat';
import { type SecurityPayload } from './security/securityType';
import { getDataFromDb, getBlogStatus, getBlogTags } from './sql/sqlMolester';
import { type BlogStatusArgs, type BlogStatusPayload, blogStatusEditor, blogEditor } from './blog/blogEditor';
import v1Router from './router/v1Router';

let additionalHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
	async fetch(request, env, ctx): Promise<Response> {
		// browser preflight for cors
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: additionalHeaders,
			});
		}

		const reqIp = request.headers.get('CF-Connecting-IP') as string;
		const { success } = await env.NO_SPAMMIE.limit({ key: reqIp });

		if (!success)
			return new Response('RATE LIMIT - get fucked wiht rate limit lmfaoooo', {
				status: 429,
				statusText: 'RATE LIMT - stop spamming dipshit',
				headers: additionalHeaders,
			});

		let version: string;
		let section: string;
		let sub: string;
		let format: string;
		let postId: number = 0;
		let tags: string;

		const { pathname } = new URL(request.url);
		const pathSegments = pathname.split('/').filter((segment) => segment.length > 0);

		// default to v1 if no version is specified
		// for now we allow all, but warn for future stuff
		const versionRe = /^v\d+$/i;

		switch (String(pathSegments[0]).match(versionRe)?.[0]) {
			case 'v1':
				version = pathSegments[0]; // v1
				section = pathSegments[1]; // personal | prod | fake
				sub = pathSegments[2]; // blog | cdn
				format = pathSegments[3]; // json | html
				break;
			case 'v2':
				// structure is /{blog | cdn}?(...)
				const searchParms = new URL(request.url).searchParams;
				version = pathSegments[0]; // v1...
				section = pathSegments[1]; // personal | prod | fake
				sub = pathSegments[2]; // blog | cdn

				format = searchParms.get('type') ?? '';
				postId = !isNaN(Number(searchParms.get('postId'))) ? Number(searchParms.get('postId')) : 0;
				tags = searchParms.get('tags') ?? '';
				break;
			default:
				version = 'v1';
				section = pathSegments[0];
				sub = pathSegments[1];
				format = pathSegments[2];
		}

		if (version == 'v1') {
			return v1Router(request, env);
		} else if (version === 'v2') {
			return new Response('not yet implemented', {
				status: 400,
				headers: { ...additionalHeaders, 'Content-Type': 'text/plain' },
			});
		} else {
			return new Response('please specify version\ncurrent available version: {/v1/}', {
				status: 400,
				headers: { ...additionalHeaders, 'Content-Type': 'text/plain' },
			});
		}

		return new Response('not found @general', { status: 404, headers: additionalHeaders });
	},
} satisfies ExportedHandler<Env>;
