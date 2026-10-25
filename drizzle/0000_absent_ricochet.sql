CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`minute` integer NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`image` text NOT NULL,
	`url` text DEFAULT '' NOT NULL,
	`tech` text DEFAULT '' NOT NULL,
	`demo` integer DEFAULT true NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`position` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`phone` text NOT NULL,
	`instagram` text DEFAULT '' NOT NULL
);
