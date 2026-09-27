CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_id` text NOT NULL,
	`provider_session_id` text NOT NULL,
	`title` text,
	`directory` text,
	`parent_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`metadata` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_provider_session_unique` ON `sessions` (`provider_id`,`provider_session_id`);--> statement-breakpoint
CREATE INDEX `sessions_recent_index` ON `sessions` (`updated_at`);