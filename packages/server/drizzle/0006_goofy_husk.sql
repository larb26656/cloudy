CREATE TABLE `cloudy_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_session_id` text NOT NULL,
	`role` text NOT NULL,
	`parts` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE INDEX `cloudy_messages_session_created_index` ON `cloudy_messages` (`provider_session_id`,`created_at`,`id`);