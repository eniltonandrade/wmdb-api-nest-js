/*
  Warnings:

  - You are about to drop the column `tmdbId` on the `people` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tmdb_id]` on the table `people` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tmdb_id` to the `people` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "people_tmdbId_key";

-- AlterTable
ALTER TABLE "people" DROP COLUMN "tmdbId",
ADD COLUMN     "tmdb_id" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "people_tmdb_id_key" ON "people"("tmdb_id");
