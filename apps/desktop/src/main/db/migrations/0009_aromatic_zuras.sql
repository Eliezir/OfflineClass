CREATE TABLE `email_settings` (
	`owner_id` text PRIMARY KEY NOT NULL,
	`host` text NOT NULL,
	`port` integer NOT NULL,
	`secure` integer DEFAULT true NOT NULL,
	`username` text DEFAULT '' NOT NULL,
	`password` text DEFAULT '' NOT NULL,
	`from_name` text NOT NULL,
	`from_email` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `answers` ADD `feedback` text;--> statement-breakpoint
ALTER TABLE `students` ADD `email` text;--> statement-breakpoint
ALTER TABLE `students` ADD `feedback` text;--> statement-breakpoint
ALTER TABLE `students` ADD `results_sent_at` integer;