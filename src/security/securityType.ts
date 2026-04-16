export type SecurityFormat = {
	Name: string;
	UsedFor: string;
	Type: string;
	Value: string;
};

export type GenerateSecurity = {
	Type: 'totp' | 'oauth2';
	Authentication: number;
};
