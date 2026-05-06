export type BlogFormat = {
	// whats the point of types if all of them are optional again?
	PostId?: number;
	postId?: number;
	Timestamp?: number;
	Tags?: string;
	Creator?: string;
	Title?: string;
	Body?: string;
	Location?: string;
};

export type BlogUpdate = {
	authenticate: number;
	authentication?: number;
	action: 'edit' | 'remove' | 'add';
	postId?: number;
	PostId?: number;
	articleContents?: BlogFormat;
};
