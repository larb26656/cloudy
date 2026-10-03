ALTER TABLE `sessions` ADD `status` text DEFAULT 'idle' NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `run_status` text DEFAULT 'idle' NOT NULL;