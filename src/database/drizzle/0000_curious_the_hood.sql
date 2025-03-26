CREATE TABLE `accounts` (
	`id` varchar(191) NOT NULL,
	`provider` enum('GOOGLE') NOT NULL,
	`provider_account_id` varchar(191) NOT NULL,
	`user_id` varchar(191) NOT NULL,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `accounts_provider_account_id_key` UNIQUE(`provider_account_id`),
	CONSTRAINT `accounts_provider_user_id_key` UNIQUE(`provider`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` varchar(191) NOT NULL,
	`name` varchar(191) NOT NULL,
	`tmdbId` int NOT NULL,
	`logo_path` varchar(191),
	CONSTRAINT `companies_id` PRIMARY KEY(`id`),
	CONSTRAINT `companies_tmdbId_key` UNIQUE(`tmdbId`)
);
--> statement-breakpoint
CREATE TABLE `genres` (
	`id` varchar(191) NOT NULL,
	`name` varchar(191) NOT NULL,
	`tmdbId` int NOT NULL,
	CONSTRAINT `genres_id` PRIMARY KEY(`id`),
	CONSTRAINT `genres_tmdbId_key` UNIQUE(`tmdbId`)
);
--> statement-breakpoint
CREATE TABLE `histories` (
	`id` varchar(191) NOT NULL,
	`user_id` varchar(191) NOT NULL,
	`movie_id` varchar(191) NOT NULL,
	`date` datetime(3) NOT NULL,
	`review` varchar(191),
	`rating` double,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `histories_id` PRIMARY KEY(`id`),
	CONSTRAINT `histories_movie_id_user_id_key` UNIQUE(`movie_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `list_movies` (
	`id` varchar(191) NOT NULL,
	`movie_id` varchar(191) NOT NULL,
	`list_id` varchar(191) NOT NULL,
	CONSTRAINT `list_movies_id` PRIMARY KEY(`id`),
	CONSTRAINT `list_movies_list_id_movie_id_key` UNIQUE(`list_id`,`movie_id`)
);
--> statement-breakpoint
CREATE TABLE `lists` (
	`id` varchar(191) NOT NULL,
	`type` enum('WATCHLIST','CUSTOM') NOT NULL,
	`name` varchar(191) NOT NULL,
	`description` varchar(191),
	`visibility` enum('PUBLIC','PRIVATE') NOT NULL,
	`user_id` varchar(191) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `lists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `movie_cast` (
	`person_id` varchar(191) NOT NULL,
	`movie_id` varchar(191) NOT NULL,
	`character` varchar(191) NOT NULL,
	`order` int NOT NULL,
	CONSTRAINT `movie_cast_person_id_movie_id` PRIMARY KEY(`person_id`,`movie_id`),
	CONSTRAINT `movie_cast_person_id_movie_id_key` UNIQUE(`person_id`,`movie_id`)
);
--> statement-breakpoint
CREATE TABLE `movie_companies` (
	`movie_id` varchar(191) NOT NULL,
	`company_id` varchar(191) NOT NULL,
	CONSTRAINT `movie_companies_company_id_movie_id` PRIMARY KEY(`company_id`,`movie_id`),
	CONSTRAINT `movie_companies_company_id_movie_id_key` UNIQUE(`company_id`,`movie_id`)
);
--> statement-breakpoint
CREATE TABLE `movie_crew` (
	`person_id` varchar(191) NOT NULL,
	`movie_id` varchar(191) NOT NULL,
	`job` varchar(191) NOT NULL,
	CONSTRAINT `movie_crew_person_id_movie_id_job` PRIMARY KEY(`person_id`,`movie_id`,`job`),
	CONSTRAINT `movie_crew_person_id_movie_id_job_key` UNIQUE(`person_id`,`movie_id`,`job`)
);
--> statement-breakpoint
CREATE TABLE `movie_genres` (
	`movie_id` varchar(191) NOT NULL,
	`genre_id` varchar(191) NOT NULL,
	CONSTRAINT `movie_genres_genre_id_movie_id` PRIMARY KEY(`genre_id`,`movie_id`),
	CONSTRAINT `movie_genres_genre_id_movie_id_key` UNIQUE(`genre_id`,`movie_id`)
);
--> statement-breakpoint
CREATE TABLE `movie_ratings` (
	`value` double NOT NULL,
	`movie_id` varchar(191) NOT NULL,
	`rating_source_id` varchar(191) NOT NULL,
	`updated_at` datetime(3),
	CONSTRAINT `movie_ratings_rating_source_id_movie_id` PRIMARY KEY(`rating_source_id`,`movie_id`),
	CONSTRAINT `movie_ratings_rating_source_id_movie_id_key` UNIQUE(`rating_source_id`,`movie_id`)
);
--> statement-breakpoint
CREATE TABLE `movies` (
	`id` varchar(191) NOT NULL,
	`title` varchar(191) NOT NULL,
	`original_title` varchar(191) NOT NULL,
	`poster_path` varchar(191),
	`backdrop_path` varchar(191),
	`release_date` datetime(3) NOT NULL,
	`runtime` int,
	`imdb_id` varchar(191) NOT NULL,
	`tmdb_id` int NOT NULL,
	`imdb_rating` double,
	`tmdb_rating` double,
	`metacritic_rating` double,
	`rotten_tomatoes_rating` double,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `movies_id` PRIMARY KEY(`id`),
	CONSTRAINT `movies_imdb_id_key` UNIQUE(`imdb_id`),
	CONSTRAINT `movies_tmdb_id_key` UNIQUE(`tmdb_id`)
);
--> statement-breakpoint
CREATE TABLE `people` (
	`id` varchar(191) NOT NULL,
	`name` varchar(191) NOT NULL,
	`tmdbId` int NOT NULL,
	`gender` int,
	`profile_path` varchar(191),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `people_id` PRIMARY KEY(`id`),
	CONSTRAINT `people_tmdbId_key` UNIQUE(`tmdbId`)
);
--> statement-breakpoint
CREATE TABLE `rating_sources` (
	`id` varchar(191) NOT NULL,
	`name` varchar(191) NOT NULL,
	`suffix` varchar(191) NOT NULL,
	`acronym` varchar(191) NOT NULL,
	CONSTRAINT `rating_sources_id` PRIMARY KEY(`id`),
	CONSTRAINT `rating_sources_acronym_key` UNIQUE(`acronym`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` varchar(191) NOT NULL,
	`name` varchar(191) NOT NULL,
	`user_id` varchar(191) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `TagsOnHistory` (
	`historyId` varchar(191) NOT NULL,
	`tagId` varchar(191) NOT NULL,
	CONSTRAINT `TagsOnHistory_historyId_tagId` PRIMARY KEY(`historyId`,`tagId`)
);
--> statement-breakpoint
CREATE TABLE `tokens` (
	`id` varchar(191) NOT NULL,
	`type` enum('PASSWORD_RECOVER') NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`user_id` varchar(191) NOT NULL,
	CONSTRAINT `tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(191) NOT NULL,
	`name` varchar(191),
	`username` varchar(191),
	`email` varchar(191) NOT NULL,
	`password_hash` varchar(191),
	`avatar_url` varchar(191),
	`preferred_rating` varchar(191),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_key` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `histories` ADD CONSTRAINT `histories_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `histories` ADD CONSTRAINT `histories_movie_id_movies_id_fk` FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `list_movies` ADD CONSTRAINT `list_movies_movie_id_movies_id_fk` FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `list_movies` ADD CONSTRAINT `list_movies_list_id_lists_id_fk` FOREIGN KEY (`list_id`) REFERENCES `lists`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `lists` ADD CONSTRAINT `lists_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `movie_cast` ADD CONSTRAINT `movie_cast_person_id_people_id_fk` FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `movie_cast` ADD CONSTRAINT `movie_cast_movie_id_movies_id_fk` FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `movie_companies` ADD CONSTRAINT `movie_companies_movie_id_movies_id_fk` FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `movie_companies` ADD CONSTRAINT `movie_companies_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `movie_crew` ADD CONSTRAINT `movie_crew_person_id_people_id_fk` FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `movie_crew` ADD CONSTRAINT `movie_crew_movie_id_movies_id_fk` FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `movie_genres` ADD CONSTRAINT `movie_genres_movie_id_movies_id_fk` FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `movie_genres` ADD CONSTRAINT `movie_genres_genre_id_genres_id_fk` FOREIGN KEY (`genre_id`) REFERENCES `genres`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `movie_ratings` ADD CONSTRAINT `movie_ratings_movie_id_movies_id_fk` FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `movie_ratings` ADD CONSTRAINT `movie_ratings_rating_source_id_rating_sources_id_fk` FOREIGN KEY (`rating_source_id`) REFERENCES `rating_sources`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tags` ADD CONSTRAINT `tags_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `TagsOnHistory` ADD CONSTRAINT `TagsOnHistory_historyId_histories_id_fk` FOREIGN KEY (`historyId`) REFERENCES `histories`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `TagsOnHistory` ADD CONSTRAINT `TagsOnHistory_tagId_tags_id_fk` FOREIGN KEY (`tagId`) REFERENCES `tags`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tokens` ADD CONSTRAINT `tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE cascade;