ALTER TABLE `movie_ratings` DROP INDEX `movie_ratings_rating_source_id_movie_id_key`;--> statement-breakpoint
ALTER TABLE `movie_ratings` DROP FOREIGN KEY `movie_ratings_rating_source_id_rating_sources_id_fk`;
--> statement-breakpoint
ALTER TABLE `movie_ratings` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `movie_ratings` ADD `score` double NOT NULL;--> statement-breakpoint
ALTER TABLE `movie_ratings` ADD `ratingSource` enum('IMDB','TMDB','ROTTEN_TOMATOES','METACRITIC');--> statement-breakpoint
ALTER TABLE `movie_ratings` ADD CONSTRAINT `movie_ratings_rating_source_id_movie_id_key` UNIQUE(`ratingSource`,`movie_id`);--> statement-breakpoint
ALTER TABLE `movie_ratings` DROP COLUMN `value`;--> statement-breakpoint
ALTER TABLE `movie_ratings` DROP COLUMN `rating_source_id`;