import { Env } from '..';
import { type BlogFormat, type BlogUpdate } from './blogFormat';
import { getDataFromDb, insertIntoDb, setBlogStatus, updateDb, deleteFromDb, entryExistence } from '../sql/sqlMolester';

type BlogEditArguments = {
	action: 'remove' | 'add' | 'edit';
	postId?: number;
	articleContents: BlogFormat | null;
};

export const blogStatusPretext = {
	comment: 'Comment',
	favPostId: 'favPostId',
	commentTimeStamp: 'commentTimeStamp',
	commentOwner: 'commentOwner',
};

export interface BlogStatusArgs {
	updateWhat: 'comment' | 'favPostId' | 'commentTimeStamp' | 'commentOwner';
	toValue: string | number;
}

export type BlogStatusPayload = {
	authenticate: number;
	authentication?: number;
	updateItems: Array<BlogStatusArgs>;
};

export type ErrorReturnCodes =
	| -1 // fatal unhandled error
	| 0 // no error, u good

	// blog stat editor related
	// // myThoughts related
	| 2 // stat updated!
	| 2.1 // malformed/missing fields
	| 2.2 // not yet implemented
	| 2.3 // page stat cant be updated

	// // fav article picker related
	| 3 // picked!
	| 3.1 // malformed/missing field
	| 3.2 // postId not found

	// // article creator related
	| 4 // created
	| 4.1 // malformed/missing field
	| 4.2 // not yet implemented
	| 4.3 // content/header/tags/creator missing
	| 4.4 // article creator failed...

	// // article editor related
	| 5 // edited!
	| 5.1 // malformed/missing field
	| 5.2 // missing postId
	| 5.3 // not yet implemented
	| 5.4 // post does not exist
	| 5.5 // editor mysteriously died (check log wtf)

	// // article removal related
	| 6 // removed!
	| 6.1 // malformed/missing field
	| 6.2 // postId missing
	| 6.3 // post does not exist
	| 6.4; // post removal failed (uh)

export async function blogStatusEditor(env: Env, updateData?: Array<BlogStatusArgs>): Promise<[boolean, ErrorReturnCodes]> {
	console.log('blogStatusEditor called');
	if (!updateData || updateData.length === 0 || typeof updateData[0] !== 'object') return [false, 2.1];

	if (updateData.length == 4) {
		for (const update of updateData) {
			const result = await setBlogStatus(env, update);
			if (!result) return [false, 2.3];
		}
	} else if (updateData.length == 1) {
		const result = await setBlogStatus(env, updateData[0]);
		if (!result) return [false, 2.3];
	}
	return [true, 2];
}

export async function blogEditor(env: Env, args: BlogEditArguments): Promise<[boolean, number | ErrorReturnCodes]> {
	// INSERT INTO Blog (PostId, Timestamp, Tags, Creator, Title, Body, Location)
	if (args.action == 'add') {
		if (!args.articleContents) return [false, 4.1];

		const result = await insertIntoDb(env, args.articleContents, 'blog');
		if (result) return [result, 3];
		else return [false, 4.4];
	} else if (args.action == 'edit') {
		if (!args.postId || !args.articleContents) return [false, 5.1];

		// check for article's existence
		const ifExists = await entryExistence(env, args.postId);
		if (!ifExists) return [false, 5.4];

		const result = await updateDb(env, args.postId, args.articleContents, 'blog');
		if (result) return [result, 5];
		else return [false, 5.5];
	} else if (args.action == 'remove') {
		if (!args.postId) return [false, 6.2];

		// check for article's existence
		const ifExists = await entryExistence(env, args.postId);
		if (!ifExists) return [false, 6.3];

		const result = await deleteFromDb(env, args.postId, 'blog');
		if (result) return [result, 6];
		else return [false, 6.4];
	} else return [false, -1];
}
