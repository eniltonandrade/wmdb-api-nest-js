/*
  Warnings:

  - You are about to drop the column `tmdbId` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `tmdbId` on the `genres` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tmdb_id]` on the table `companies` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tmdb_id]` on the table `genres` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tmdb_id` to the `companies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tmdb_id` to the `genres` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "companies_tmdbId_key";

-- DropIndex
DROP INDEX "genres_tmdbId_key";

-- AlterTable
ALTER TABLE "companies" DROP COLUMN "tmdbId",
ADD COLUMN     "tmdb_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "genres" DROP COLUMN "tmdbId",
ADD COLUMN     "tmdb_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "preferred_rating" SET DEFAULT 'TMDB';

-- CreateIndex
CREATE UNIQUE INDEX "companies_tmdb_id_key" ON "companies"("tmdb_id");

-- CreateIndex
CREATE UNIQUE INDEX "genres_tmdb_id_key" ON "genres"("tmdb_id");
