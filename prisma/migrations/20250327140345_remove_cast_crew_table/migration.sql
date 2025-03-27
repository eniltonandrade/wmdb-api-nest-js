/*
  Warnings:

  - You are about to drop the `movie_cast` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `movie_crew` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `movie_cast` DROP FOREIGN KEY `movie_cast_movie_id_fkey`;

-- DropForeignKey
ALTER TABLE `movie_cast` DROP FOREIGN KEY `movie_cast_person_id_fkey`;

-- DropForeignKey
ALTER TABLE `movie_crew` DROP FOREIGN KEY `movie_crew_movie_id_fkey`;

-- DropForeignKey
ALTER TABLE `movie_crew` DROP FOREIGN KEY `movie_crew_person_id_fkey`;

-- DropTable
DROP TABLE `movie_cast`;

-- DropTable
DROP TABLE `movie_crew`;
