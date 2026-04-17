import { getDataFromDb } from '../sql/sqlMolester';
import { Env } from '..';

// @ts-ignore
import { toXML } from 'jstoxml';

type BlogArgument = {
	amount: number;
	format: 'json' | 'xml' | 'info';
	tag?: string;
	author?: string;
	date?: [number, number]; // basically [from, to]
};

type BlogStructure = {
	PostId: number;
	Timestamp: number;
	Tags: string;
	Creator: string;
	Title: string;
	Body: string;
	Location: string;
};

export default async function getBlogPosts(argument: BlogArgument, env: Env, postIdRequested?: number): Promise<string | false> {
	if (argument.amount > 15) return false;

	const dbFetch = await getDataFromDb(env, 'blog', postIdRequested);

	if (dbFetch.success !== true) {
		return dbFetch.success;
	}

	if (argument.format == 'json') return JSON.stringify(dbFetch.results);
	else if (argument.format == 'xml') {
		const xmlOptions = { header: false, indent: '  ' };
		const items = dbFetch.results.map((article) => {
			const fixedArticle = {
				guid: article.PostId,
				// @ts-ignore (shut up bitch)
				pubDate: new Date(article.Timestamp).toUTCString(),
				category: article.Tags,
				author: article.Creator,
				title: article.Title,
				description: article.Body,
				location: article.Location,
			};
			return { item: fixedArticle };
		});
		return toXML(
			{
				_name: 'rss',
				_attrs: {
					version: '2.0',
					encoding: 'UTF-8',
				},
				_content: {
					channel: [
						{
							title: "nogc's rss blog",
						},
						{
							description: 'my blog articles, but in xml format',
						},
						{
							link: 'blog.nogisoft.work',
						},
						{
							lastBuildDate: () => new Date().toUTCString(),
						},
						{
							pubDate: () => new Date().toUTCString(),
						},
						{
							language: 'en',
						},
						...items,
					],
				},
			},
			xmlOptions,
		) as string;
	} else return false;
}
