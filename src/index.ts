export interface Env {
	// If you set another name in the Wrangler config file for the value for 'binding',
	// replace "DB" with the variable name you defined.
	personal_api: D1Database;
	NO_SPAMMIE: RateLimit;
	MASTER_CRED: string;
}

import getBlogPosts from './blog/blogConverter';
import blogEditor from './blog/blogEditor';
import timeOTP from './security/timeOTP';
import { type BlogFormat, type BlogUpdate } from './blog/blogFormat';
import { type GenerateSecurity } from './security/securityType';

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

		if (section === 'personal' && sub === 'blog') {
			const url = new URL(request.url);
			const requestArguments = url.search ? url.search.slice(1).split('&') : []; // things after the `?` args
			const formatRequestType = format.split('?')[0]; // things like /json

			// post req related
			if (formatRequestType == 'edit') {
				if (request.method !== 'POST') return new Response('wrong method bozo', { status: 405 });
				if (request.headers.get('content-type') !== 'application/json') return new Response('no content-type?', { status: 415 });

				let payload: null | BlogUpdate = null;
				try {
					payload = await request.json();
				} catch (error) {
					return new Response('wheres the fucking payload then?', { status: 400 });
				}

				const payloadRequest = payload as BlogUpdate;
				const actionType = payloadRequest.action;

				if (!payload?.authenticate) {
					return new Response('who the fuck are you?', { status: 401 });
				}

				if (actionType !== 'add' && actionType !== 'edit' && actionType !== 'remove')
					return new Response(
						'so you want to make privileged post calls, but you cant even figured what u want? o yea right let me `await openai.chat.completions.create({model: "gpt-5.4-pro", message: "can u check wtf is this su dude wants?"})`, LMFAO MATIKANETANNHAUSER ON THE KEYBOARD CHURNING SLOPS RN',
						{ status: 400 },
					);

				// authetication verifying ts
				const isVerified = await timeOTP('verify', env, payload.authenticate);

				if (!isVerified[0]) return new Response('close, but still who the fuck are you?', { status: 401 });

				// after like bajillion checks later, we can actually like molest the database frfr
				// with another bajillion more checks, 💀
				const pendingData = payloadRequest.articleContents as BlogFormat;
				if (actionType == 'add') {
					if (!pendingData.Body && !pendingData.Title && !pendingData.Tags && !pendingData.Creator)
						return new Response('missing fields', { status: 400 });

					const result = await blogEditor(env, {
						action: 'add',
						articleContents: pendingData,
					});
					if (result[0]) {
						return new Response(JSON.stringify(result[1]), { status: 200 });
					} else {
						return new Response('no append op was made, check ur shit mane', { status: 400 });
					}
				} else if (actionType == 'edit') {
					const result = await blogEditor(env, {
						action: 'edit',
						postId: payloadRequest.postId,
						articleContents: pendingData,
					});
					if (result[0]) return new Response(JSON.stringify(result[1]), { status: 200 });
					else return new Response('no append op was made, check ur shit mane', { status: 400 });
				} else if (actionType == 'remove') {
					const result = await blogEditor(env, {
						action: 'remove',
						postId: payloadRequest.postId,
						articleContents: null,
					});
					console.log(result);
					if (result[0]) return new Response(JSON.stringify(result[1]), { status: 200 });
					else return new Response('no remove op was made, check ur shit mane', { status: 400 });
				}

				return new Response(JSON.stringify(payload), { status: 200 });
			}

			// simple ass get req
			if ((formatRequestType === 'json' || formatRequestType === 'xml') && request.method == 'GET') {
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
		}

		if (section === 'personal' && sub === 'security') {
			if (request.method !== 'POST') return new Response('wrong method', { status: 405 });

			const payload: GenerateSecurity = await request.json();

			if (!payload.Authentication) return new Response('egg and chicken, again, wheres authentication?', { status: 401 });

			if (payload.Type.toLowerCase() == 'totp') {
				const [isGenerated, totp] = await timeOTP('generate', env);
				if (!isGenerated) return new Response('totp failed to generate', { status: 401 });
				return new Response(`otp generated: otpauth://totp/ngsw-blog?secret=${totp}&issuer=ngsw-blog`, {
					status: 200,
				});
			}
		}

		if (section === 'personal') return new Response('not found @personal', { status: 404 });

		return new Response('not found @general', { status: 404 });
	},
} satisfies ExportedHandler<Env>;
