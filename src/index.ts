export interface Env {
	// If you set another name in the Wrangler config file for the value for 'binding',
	// replace "DB" with the variable name you defined.
	personal_api: D1Database;
	NO_SPAMMIE: RateLimit;
}

import getBlogPosts from './blog/blogFormatter';

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const reqIp = request.headers.get('CF-Connecting-IP') as string;
		const { success } = await env.NO_SPAMMIE.limit({ key: reqIp });

		if (!success)
			return new Response('RATE LIMIT - get fucked wiht rate limit lmfaoooo', {
				status: 429,
				statusText: 'RATE LIMT - stop spamming dipshit',
			});

		const { pathname } = new URL(request.url);

		const [, section, sub, format] = pathname.split('/');

		if (section === 'personal' && sub === 'blog' && request.method == 'GET') {
			const url = new URL(request.url);
			const requestArguments = url.search ? url.search.slice(1).split('&') : [];
			let [amount, tag]: [number, string | null] = [10, null];
			requestArguments
				? requestArguments.forEach((e) => {
						const splitOut = e.split('=');
						splitOut[0].includes('amount') ? (amount = Number(splitOut[1])) : (tag = String(splitOut[1]) ?? null);
					})
				: [10, null];

			if (amount > 15) return new Response('too much!!!111', { status: 429 });

			if (format !== 'xml' && format !== 'json') return new Response('incorrect type @blog', { status: 404 });

			const blogPostResult = await getBlogPosts({ amount: amount, format: format }, env);
			if (blogPostResult)
				return new Response(blogPostResult, {
					headers: { 'Content-Type': format == 'json' ? 'application/json' : 'application/rss+xml' },
				});
			else return new Response('failed');
		}

		if (section === 'personal') return new Response('not found @personal', { status: 404 });

		return new Response('not found @general', { status: 404 });
	},
} satisfies ExportedHandler<Env>;
