import { Env } from '..';
import { type BlogFormat, type BlogUpdate } from './blogFormat';
import { getDataFromDb, insertIntoDb, updateDb, deleteFromDb, entryExistence } from '../sql/sqlMolester';

type BlogEditArguments = {
	action: 'remove' | 'add' | 'edit';
	postId?: number;
	articleContents: BlogFormat | null;
};

export type ErrorReturnCodes = [
	| 0 // no error, u good
	| 1 // no postId given (edit, remove)
	| 2 // args.action / error in output
	| 3 // no articleContents given (add, edit)
	| 4 // make edit? nah dont feel like it (edit)
	| 5, // article does not exist (edit, remove)
];

export default async function blogEditor(env: Env, args: BlogEditArguments): Promise<[boolean, number | ErrorReturnCodes]> {
	// INSERT INTO Blog (PostId, Timestamp, Tags, Creator, Title, Body, Location)
	if (args.action == 'add') {
		if (!args.articleContents) return [false, 4];

		const result = await insertIntoDb(env, args.articleContents, 'blog');
		if (result) return [result, 0];
		else return [false, 4];
	} else if (args.action == 'edit') {
		if (!args.postId) return [false, 1];
		if (!args.articleContents) return [false, 4];

		// check for article's existence
		const ifExists = await entryExistence(env, args.postId);
		if (!ifExists) return [false, 5];

		const result = await updateDb(env, args.postId, args.articleContents, 'blog');
		if (result) return [result, args.postId];
		else return [false, 2];
	} else if (args.action == 'remove') {
		if (!args.postId) return [false, 1];

		// check for article's existence
		const ifExists = await entryExistence(env, args.postId);
		if (!ifExists) return [false, 5];

		const result = await deleteFromDb(env, args.postId, 'blog');
		if (result) return [result, args.postId];
		else return [false, 4];
	} else return [false, 2];
}
