CREATE TABLE `media_chunks` (
	`file_id` text NOT NULL,
	`chunk_index` integer NOT NULL,
	`data` blob NOT NULL,
	PRIMARY KEY(`file_id`, `chunk_index`),
	FOREIGN KEY (`file_id`) REFERENCES `media_files`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `media_files` (
	`id` text PRIMARY KEY NOT NULL,
	`content_type` text NOT NULL,
	`byte_size` integer NOT NULL,
	`chunk_count` integer NOT NULL,
	`created_at` integer NOT NULL
);
