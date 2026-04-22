export type SecurityFormat = {
	Name: string;
	UsedFor: string;
	Type: string;
	Value: string;
};

export type SecurityPayload = {
	Type: 'totp' | 'oauth2' | 'verify';
	Authentication: number;
};
