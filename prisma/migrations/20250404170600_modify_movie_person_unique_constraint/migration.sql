/*
  Warnings:

  - The primary key for the `movie_person` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[person_id,movie_id,character]` on the table `movie_person` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "movie_person_person_id_movie_id_role_key";

-- AlterTable
ALTER TABLE "movie_person" DROP CONSTRAINT "movie_person_pkey",
ADD CONSTRAINT "movie_person_pkey" PRIMARY KEY ("person_id", "movie_id");

-- CreateIndex
CREATE UNIQUE INDEX "movie_person_person_id_movie_id_character_key" ON "movie_person"("person_id", "movie_id", "character");
