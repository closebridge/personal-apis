DROP TABLE IF EXISTS Blog;

CREATE TABLE IF NOT EXISTS Blog (
	PostId INTEGER PRIMARY KEY,
	Timestamp INTEGER,
	Tags TEXT,
	Creator TEXT,
	Title TEXT,
	Body TEXT,
	Location TEXT
);

INSERT INTO Blog (PostId, Timestamp, Tags, Creator, Title, Body, Location)
	VALUES
		(1, 1776166307026, "test,hi chat", "closebridge", "Testing", "# hi hi can you read me loud and clear or something idk?", "vietnam"),
		(2, 1776124533000, "test,hi chat", "closebridge", "even more testing", "# I AM DOING THIS SHIT AGAIN, U HEARD?\n\n# XLarge Headline\n\n## Large Headline\n\n### Medium Headline\n\n#### Small Headline\n\nThis is **bold text** and this is *italic text* and this is ~~strikethrough~~\n\nThis is a longer piece of text that should wrap to multiple lines. It demonstrates how text behaves when it exceeds the width of its container.\n\n```\nBlock content here:\n+ Item A\n+ Item B\n```\n\n![img](https://example.com/image.jpg)\n*cute image caption*\n\n---\n*John, Cool Engineer*		", "vietnam");
