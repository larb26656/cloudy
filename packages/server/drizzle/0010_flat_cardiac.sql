CREATE TABLE `automations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`prompt` text NOT NULL,
	`provider_instance_id` text NOT NULL,
	`agent_id` text,
	`model` text,
	`directory_mode` text NOT NULL,
	`directory_path` text,
	`schedule` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `automation_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`automation_id` text NOT NULL,
	`trigger` text NOT NULL,
	`scheduled_for` integer,
	`state` text NOT NULL,
	`phase` text,
	`session_id` text,
	`output` text,
	`error` text,
	`reason` text,
	`config_snapshot` text NOT NULL,
	`owner_id` text,
	`lease_expires_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`started_at` integer,
	`finished_at` integer,
	FOREIGN KEY (`automation_id`) REFERENCES `automations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `automation_runs_history_index` ON `automation_runs` (`automation_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `automation_runs_scheduled_slot_unique` ON `automation_runs` (`automation_id`,`scheduled_for`);--> statement-breakpoint
CREATE UNIQUE INDEX `automation_runs_one_active_per_automation` ON `automation_runs` (`automation_id`) WHERE "automation_runs"."state" in ('pending', 'running');