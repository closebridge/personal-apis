import getBlogPosts from '../blog/blogConverter';
import timeOTP from '../security/timeOTP';
import { type BlogFormat, type BlogUpdate } from '../blog/blogFormat';
import { type SecurityPayload } from '../security/securityType';
import { getDataFromDb, getBlogStatus, getBlogTags } from '../sql/sqlMolester';
import { type BlogStatusArgs, type BlogStatusPayload, blogStatusEditor, blogEditor } from '../blog/blogEditor';
import { type Env } from '../index';

let additionalHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
const outdatedVersionHeaders = {
	'X-Outdated-Version': 'true',
	warning: 'future calls must specify version',
};

export default async function v1Router(request: Request, env: Env): Promise<Response> {
	const { pathname } = new URL(request.url);

	const pathSegments = pathname.split('/').filter((segment) => segment.length > 0);
	let _;
	let section: string;
	let sub: string;
	let format: string;

	switch (String(pathSegments[0])) {
		case 'v1':
			_ = pathSegments[0];
			section = pathSegments[1];
			sub = pathSegments[2];
			format = pathSegments[3];
			break;
		default:
			section = pathSegments[0];
			sub = pathSegments[1];
			format = pathSegments[2];
	}

	if (section === 'personal' && sub === 'blog') {
		const url = new URL(request.url);
		const requestArguments = url.search ? url.search.slice(1).split('&') : []; // things after the `?` args
		const formatRequestType = format ? format.split('?')[0] : null; // things like /json

		// post req related

		if (formatRequestType === 'info' && request.method == 'POST') {
			console.log('POST /info hit');
			let payload: null | BlogStatusPayload = null;
			try {
				payload = await request.json();
			} catch (error) {
				return new Response('wheres the fucking payload then?', { status: 400, headers: additionalHeaders });
			}

			if (payload?.authentication) {
				return new Response('its "authenticate", not "authentication", dumb fuck', { status: 401, headers: additionalHeaders });
			} else if (!payload?.authenticate) {
				return new Response('who the fuck are you?', { status: 401, headers: additionalHeaders });
			}

			const isVerified = await timeOTP('verify', env, payload.authenticate);
			if (!isVerified[0]) return new Response('close, but still who the fuck are you?', { status: 401, headers: additionalHeaders });

			const result = await blogStatusEditor(env, payload.updateItems as Array<BlogStatusArgs>);
			if (!result[0]) return new Response('failed to update blog status', { status: 500, headers: additionalHeaders });
			return new Response('blog status updated', { status: 200, headers: additionalHeaders });
		}

		if (formatRequestType === 'edit') {
			if (request.method !== 'POST') return new Response('wrong method bozo', { status: 405, headers: additionalHeaders });
			if (request.headers.get('content-type') !== 'application/json')
				return new Response('no content-type?', { status: 415, headers: additionalHeaders });

			let payload: null | BlogUpdate = null;
			try {
				payload = await request.json();
			} catch (error) {
				return new Response('wheres the fucking payload then?', { status: 400, headers: additionalHeaders });
			}

			const payloadRequest = payload as BlogUpdate;
			const actionType = payloadRequest.action;

			if (!payload?.authenticate) {
				return new Response('who the fuck are you?', { status: 401, headers: additionalHeaders });
			}

			if (payload?.authentication) {
				return new Response('its "authenticate", not "authentication", dumb fuck', { status: 400, headers: additionalHeaders });
			}

			if (actionType !== 'add' && actionType !== 'edit' && actionType !== 'remove')
				return new Response(
					'so you want to make privileged post calls, but you cant even figured what u want? o yea right let me `await openai.chat.completions.create({model: "gpt-5.4-pro", message: "can u check wtf is this su dude wants?"})`, LMFAO MATIKANETANNHAUSER ON THE KEYBOARD CHURNING SLOPS RN\n\n\nsorry i was being such a meanie, u have to provide the action type (add, edit, or remove) you want to perform ya?',
					{ status: 400, headers: additionalHeaders },
				);

			// authetication verifying ts
			const isVerified = await timeOTP('verify', env, payload.authenticate);

			if (!isVerified[0]) return new Response('close, but still who the fuck are you?', { status: 401, headers: additionalHeaders });

			// after like bajillion checks later, we can actually like molest the database frfr
			// with another bajillion more checks, 💀
			const pendingData = payloadRequest.articleContents as BlogFormat;
			if (actionType == 'add') {
				if (!pendingData.Body) pendingData.Body = '';
				if (!pendingData.Title) pendingData.Title = 'empty title...';
				if (!pendingData.Tags) pendingData.Tags = '';
				if (!pendingData.Creator) pendingData.Creator = 'closebridge';
				if (!pendingData.Timestamp) pendingData.Timestamp = Date.now();

				const result = await blogEditor(env, {
					action: 'add',
					articleContents: pendingData,
				});
				if (result[0]) {
					return new Response(JSON.stringify(result[1]), {
						status: 200,
						headers: { ...additionalHeaders, 'Content-Type': 'application/json' },
					});
				} else {
					return new Response(`no remove op was made, check ur shit mane (${result[1]})`, { status: 400, headers: additionalHeaders });
				}
			} else if (actionType == 'edit') {
				if (!payloadRequest.postId) return new Response('missing post id', { status: 400, headers: additionalHeaders });

				const result = await blogEditor(env, {
					action: 'edit',
					postId: payloadRequest.postId,
					articleContents: pendingData,
				});
				if (result[0])
					return new Response(JSON.stringify(result[1]), {
						status: 200,
						headers: { ...additionalHeaders, 'Content-Type': 'application/json' },
					});
				else return new Response(`no remove op was made, check ur shit mane (${result[1]})`, { status: 400, headers: additionalHeaders });
			} else if (actionType == 'remove') {
				const result = await blogEditor(env, {
					action: 'remove',
					postId: payloadRequest?.articleContents?.postId ?? payloadRequest.postId,
					articleContents: null,
				});
				console.log(result);
				if (result[0])
					return new Response(JSON.stringify(result[1]), {
						status: 200,
						headers: { ...additionalHeaders, 'Content-Type': 'application/json' },
					});
				else return new Response(`no remove op was made, check ur shit mane (${result[1]})`, { status: 400, headers: additionalHeaders });
			}

			return new Response(JSON.stringify(payload), {
				status: 200,
				headers: { ...additionalHeaders, 'Content-Type': 'application/json' },
			});
		}

		// simple ass get req
		if (
			formatRequestType &&
			(formatRequestType === 'json' || formatRequestType === 'xml' || formatRequestType === 'info') &&
			request.method == 'GET'
		) {
			let amount = 10;
			let tag: string | null = null;
			let postIdRequested: number = 0;

			if (formatRequestType === 'info') {
				const result = await getBlogStatus(env);
				let blogInfoString: object = {};
				if (result) {
					for (const blogMeta of result.results) {
						console.log(blogMeta);
						blogInfoString = { ...blogInfoString, [blogMeta.Type as keyof typeof blogInfoString]: blogMeta.Value };
					}
				} else return new Response('no blog info found', { status: 404, headers: additionalHeaders });

				if (Object.keys(blogInfoString).length)
					return new Response(JSON.stringify(blogInfoString), {
						status: 200,
						headers: { ...additionalHeaders, 'Content-Type': 'text/xml' },
					});
			}

			if (requestArguments) {
				for (const arg of requestArguments) {
					const [key, value] = arg.split('=');
					console.log([key, value]);
					if (key.toLowerCase() == 'amount') amount = Number(value);
					else if (key.toLowerCase() == 'tag') tag = value || null;
					else if (key.toLowerCase() == 'postid') postIdRequested = Number(value);
				}
			}

			if (amount > 15) return new Response('too much!!!111', { status: 429, headers: additionalHeaders });

			if (formatRequestType !== 'xml' && formatRequestType !== 'json' && formatRequestType !== 'info' && formatRequestType !== 'tags')
				return new Response('incorrect type @blog', { status: 404, headers: additionalHeaders });

			const blogPostResult = await getBlogPosts({ amount: amount, format: formatRequestType, tag: tag ?? '' }, env, postIdRequested);

			if (blogPostResult)
				return new Response(blogPostResult, {
					headers: { ...additionalHeaders, 'Content-Type': formatRequestType == 'json' ? 'application/json' : 'application/rss+xml' },
				});
			else return new Response('failed', { headers: additionalHeaders });
		} else if (formatRequestType === 'tags') {
			const tagsResult = await getBlogTags(env);
			if (tagsResult)
				return new Response(JSON.stringify(tagsResult), {
					headers: { ...additionalHeaders, 'Content-Type': 'application/json' },
				});
			else return new Response('failed', { headers: additionalHeaders });
		}
	}

	if (!section) {
		return new Response('endpoints as: /v1/personal/blog/{json|xml|edit|tags|info}, /v1/personal/security', {
			status: 200,
			headers: { ...additionalHeaders, 'Content-Type': 'text/plain' },
		});
	}

	if (section === 'personal' && sub === 'security') {
		if (request.method !== 'POST') return new Response('wrong method', { status: 405, headers: additionalHeaders });

		let payload: SecurityPayload | null = null;
		try {
			payload = await request.json();
		} catch (error) {
			return new Response('wheres the fucking payload then?', { status: 400, headers: additionalHeaders });
		}

		if (!payload?.Authentication)
			return new Response('egg and chicken, again, wheres authentication?', { status: 401, headers: additionalHeaders });

		if (!payload.Type || typeof payload.Type !== 'string')
			return new Response('missing security type', { status: 400, headers: additionalHeaders });

		if (payload.Type.toLowerCase() === 'verify') {
			if (!payload.Authentication || typeof payload.Authentication !== 'number')
				return new Response('missing verification code', { status: 400, headers: additionalHeaders });
			const [isValid] = await timeOTP('verify', env, payload.Authentication);
			if (!isValid) return new Response('it said false, incorrect authentication', { status: 401, headers: additionalHeaders });
			return new Response('verification successful, somehow', { status: 200, headers: additionalHeaders });
		}

		if (payload.Type.toLowerCase() === 'totp') {
			const [isGenerated, totp] = await timeOTP('generate', env);
			if (!isGenerated) return new Response('totp failed to generate', { status: 401, headers: additionalHeaders });
			return new Response(`otp generated: otpauth://totp/ngsw-blog?secret=${totp}&issuer=ngsw-blog`, {
				status: 200,
				headers: { ...additionalHeaders, 'Content-Type': 'text/plain' },
			});
		}

		return new Response('unsupported security type', { status: 400, headers: additionalHeaders });
	}

	if (section === 'personal' && !sub) {
		return new Response('endpoints for personal: /personal/blog, /personal/security', {
			status: 200,
			headers: { ...additionalHeaders, 'Content-Type': 'text/plain' },
		});
	}

	if (section === 'personal' && sub === 'blog' && !format) {
		return new Response('endpoints for personal/blog: /personal/blog/{json|xml|edit|tags|info}', {
			status: 200,
			headers: { ...additionalHeaders, 'Content-Type': 'text/plain' },
		});
	}

	if (section === 'personal') return new Response('not found @personal', { status: 404, headers: additionalHeaders });
	return new Response(`given ${request.url} is not a valid format for /blog`, { status: 404, headers: additionalHeaders });
}
