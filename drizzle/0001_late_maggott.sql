ALTER TABLE `projects` ADD `visible` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `nature` text DEFAULT 'commercial' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `stage` text DEFAULT 'review' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `features` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `gallery` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `source_url` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `segment` text DEFAULT '' NOT NULL;