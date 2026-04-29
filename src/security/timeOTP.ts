import secretStorage from './secretsStorage';
import { Env } from '..';
import { getDataFromDb, insertIntoDb } from '../sql/sqlMolester';
import { SecurityFormat } from './securityType';

function base32Decode(str: string) {
	const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
	const out = [];

	str = str.toUpperCase().replace(/[^A-Z2-7]/g, '');

	let bits = 0;
	let val = 0;

	for (const c of str) {
		const idx = alpha.indexOf(c);
		if (idx === -1) continue;
		val = (val << 5) | idx;
		bits += 5;
		if (bits >= 8) {
			out.push((val >>> (bits - 8)) & 0xff);
			bits -= 8;
		}
	}

	return new Uint8Array(out);
}

function generateToken() {
	const bytes = crypto.getRandomValues(new Uint8Array(20));
	const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

	let result = '';
	let bits = 0;

	let val = 0;
	for (const byte of bytes) {
		val = (val << 8) | byte;
		bits += 8;
		while (bits >= 5) {
			result += alpha[(val >>> (bits - 5)) & 31];
			bits -= 5;
		}
	}

	return result;
}

export default async function totp(method: 'verify' | 'generate', env: Env, secret?: number): Promise<[boolean, any]> {
	if (method == 'generate') {
		const generatedToken = generateToken();
		if (!generatedToken) return [false, null];

		const generatedTokenStructure: SecurityFormat = {
			Name: 'TOTP',
			UsedFor: 'TOTP',
			Type: 'base8',
			Value: generatedToken,
		};

		try {
			const result = await insertIntoDb(env, generatedTokenStructure, 'security');
			if (result) return [true, generatedToken];
			else return [false, null];
		} catch (error) {
			console.error('Failed to store TOTP secret:', error);
			return [false, null];
		}
	}

	if (secret === undefined) {
		console.error('secret arg empty');
		return [false, null];
	}

	try {
		const encryptedTOTP = await getDataFromDb(env, 'totp');

		if (!encryptedTOTP || !encryptedTOTP.results || encryptedTOTP.results.length === 0) {
			console.error('No TOTP secrets found in database');
			return [false, null];
		}

		// -20/+20 sec time drift
		const timeSteps = [0, -20, 20];
		const currentTimeStep = Math.floor(Date.now() / 1000 / 30);

		for (const totpRecord of encryptedTOTP.results) {
			const currentTOTP = totpRecord.Value as string;

			if (!currentTOTP || currentTOTP.length < 16) {
				console.error('Invalid TOTP secret format');
				continue;
			}

			try {
				const key = await crypto.subtle.importKey('raw', base32Decode(currentTOTP), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);

				for (const stepOffset of timeSteps) {
					const counter = BigInt(currentTimeStep + stepOffset);
					const buf = new ArrayBuffer(8);
					new DataView(buf).setBigUint64(0, counter, false);

					const hmac = new Uint8Array(await crypto.subtle.sign('HMAC', key, buf));
					const off = hmac[19] & 0xf;
					const code =
						(((hmac[off] & 0x7f) << 24) | ((hmac[off + 1] & 0xff) << 16) | ((hmac[off + 2] & 0xff) << 8) | (hmac[off + 3] & 0xff)) %
						1_000_000;
					const finalTOTP = String(code).padStart(6, '0');

					if (Number(finalTOTP) === secret) {
						return [true, finalTOTP];
					}
				}
			} catch (error) {
				console.error('totp cant be processed, ignoring... ', error);
				continue;
			}
		}
	} catch (error) {
		console.error('totp verification returned as no-match:', error);
		return [false, null];
	}

	return [false, null];
}
