ALTER TABLE `exams` ADD `subject` text;--> statement-breakpoint
ALTER TABLE `exams` ADD `grade_level` text;--> statement-breakpoint
ALTER TABLE `exams` ADD `icon` text;--> statement-breakpoint
ALTER TABLE `questions` ADD `points` real DEFAULT 1 NOT NULL;