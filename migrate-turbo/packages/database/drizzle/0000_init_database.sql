CREATE TABLE "ideas" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text,
	"tags" text[],
	"status" text DEFAULT 'draft' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"path" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ideas_path_unique" UNIQUE("path")
);
