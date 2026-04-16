import { Env } from '..';

// ngl no one gaf about my blog so uh?
export default async function decryptMasterSecret(env: Env, toDecrypt: string) {
	const decryptToken = env.MASTER_CRED ?? null;
	if (!decryptToken) throw new Error(`No secret found for ${toDecrypt}`);

	const bytes = Uint8Array.from(atob(decryptToken), (c) => c.charCodeAt(0));
	const iv = bytes.slice(0, 12);
	const data = bytes.slice(12);
	const key = await crypto.subtle.importKey(
		'raw',
		Uint8Array.from(toDecrypt, (c) => c.charCodeAt(0)),
		{ name: 'AES-GCM' },
		false,
		['decrypt'],
	);
	const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
	return new TextDecoder().decode(plain);
}
