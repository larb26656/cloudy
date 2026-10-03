PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_id` text NOT NULL,
	`provider_session_id` text NOT NULL,
	`title` text,
	`directory` text,
	`parent_id` text,
	`status` text DEFAULT '"idle"' NOT NULL,
	`run_status` text DEFAULT 'idle' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	`metadata` text
);
--> statement-breakpoint
INSERT INTO `__new_sessions`("id", "provider_id", "provider_session_id", "title", "directory", "parent_id", "status", "run_status", "created_at", "updated_at", "deleted_at", "metadata") SELECT "id", "provider_id", "provider_session_id", "title", "directory", "parent_id", CASE WHEN "status" = 'idle' THEN '"idle"' ELSE "status" END, "run_status", "created_at", "updated_at", "deleted_at", "metadata" FROM `sessions`;--> statement-breakpoint
DROP TABLE `sessions`;--> statement-breakpoint
ALTER TABLE `__new_sessions` RENAME TO `sessions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_provider_session_unique` ON `sessions` (`provider_id`,`provider_session_id`);--> statement-breakpoint
CREATE INDEX `sessions_recent_index` ON `sessions` (`updated_at`);
