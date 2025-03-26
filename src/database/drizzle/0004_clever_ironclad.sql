ALTER TABLE `movie_ratings` DROP INDEX `movie_ratings_rating_source_id_movie_id_key`;--> statement-breakpoint
ALTER TABLE `movie_ratings` ADD `rating_source` enum('IMDB','TMDB','ROTTEN_TOMATOES','METACRITIC');--> statement-breakpoint
ALTER TABLE `movie_ratings` ADD CONSTRAINT `movie_ratings_rating_source_id_movie_id_key` UNIQUE(`rating_source`,`movie_id`);--> statement-breakpoint
ALTER TABLE `movie_ratings` DROP COLUMN `ratingSource`;