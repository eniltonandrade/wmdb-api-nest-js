/*
  Warnings:

  - You are about to drop the column `imdb_rating` on the `movies` table. All the data in the column will be lost.
  - You are about to drop the column `metacritic_rating` on the `movies` table. All the data in the column will be lost.
  - You are about to drop the column `rotten_tomatoes_rating` on the `movies` table. All the data in the column will be lost.
  - You are about to drop the column `tmdb_rating` on the `movies` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `movies` DROP COLUMN `imdb_rating`,
    DROP COLUMN `metacritic_rating`,
    DROP COLUMN `rotten_tomatoes_rating`,
    DROP COLUMN `tmdb_rating`;
