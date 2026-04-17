-- DROP TABLE IF EXISTS Blog;

-- REMEMBER TO RUN THIS BEFORE DEPLOY
-- DROP TABLE IF EXISTS Security;

CREATE TABLE IF NOT EXISTS Blog (
	PostId INTEGER PRIMARY KEY AUTOINCREMENT,
	Timestamp INTEGER,
	Tags TEXT,
	Creator TEXT,
	Title TEXT,
	Body TEXT,
	Location TEXT,
);

CREATE TABLE IF NOT EXISTS BlogInfo (
	Id INTEGER PRIMARY KEY AUTOINCREMENT,
	Type TEXT, -- comment, favorite post id, other...
	Value
);
-- FavoritePostId INTEGER,
-- Comment TEXT,
-- CommentTimestamp INTEGER,
-- CommentOwner TEXT

CREATE TABLE IF NOT EXISTS Security (
	Id INTEGER PRIMARY KEY AUTOINCREMENT,
	Name TEXT,
	UsedFor TEXT,
	Type TEXT,
	Value TEXT
);

-- INSERT INTO BlogInfo (Type, Value)
-- 	VALUES
-- 	('CommentOwner','nogc'),
-- 	('CommentTimestamp', 1776432350603),
-- 	('FavoritePostId', 1)
-- ;

-- INSERT INTO Blog (Timestamp, Tags, Creator, Title, Body, Location)
-- 	VALUES
-- 		(1776166307026, "test,hi chat", "closebridge", "Testing", "# hi hi can you read me loud and clear or something idk?", "vietnam"),
-- 		(1776124533000, "test,hi chat", "closebridge", "even more testing", "# I AM DOING THIS SHIT AGAIN, U HEARD?\n\n# XLarge Headline\n\n## Large Headline\n\n### Medium Headline\n\n#### Small Headline\n\nThis is **bold text** and this is *italic text* and this is ~~strikethrough~~\n\nThis is a longer piece of text that should wrap to multiple lines. It demonstrates how text behaves when it exceeds the width of its container.\n\n```\nBlock content here:\n+ Item A\n+ Item B\n```\n\n![img](https://share.valhalladev.org/raw/20260410_001416.png)\n*cute image caption*\n\n---\n*nogc, i made ts*		", "vietnam"
-- );

-- INSERT INTO Security (Name, UsedFor, Type, Value)
-- 	VALUES
-- 		("TOTP", "TOTP", "Base64", "");
