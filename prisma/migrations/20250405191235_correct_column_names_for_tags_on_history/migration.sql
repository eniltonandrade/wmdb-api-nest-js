/*
  Warnings:

  - The primary key for the `history_tags` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `historyId` on the `history_tags` table. All the data in the column will be lost.
  - You are about to drop the column `tagId` on the `history_tags` table. All the data in the column will be lost.
  - Added the required column `history_id` to the `history_tags` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tag_id` to the `history_tags` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "history_tags" DROP CONSTRAINT "history_tags_historyId_fkey";

-- DropForeignKey
ALTER TABLE "history_tags" DROP CONSTRAINT "history_tags_tagId_fkey";

-- AlterTable
ALTER TABLE "history_tags" DROP CONSTRAINT "history_tags_pkey",
DROP COLUMN "historyId",
DROP COLUMN "tagId",
ADD COLUMN     "history_id" TEXT NOT NULL,
ADD COLUMN     "tag_id" TEXT NOT NULL,
ADD CONSTRAINT "history_tags_pkey" PRIMARY KEY ("history_id", "tag_id");

-- AddForeignKey
ALTER TABLE "history_tags" ADD CONSTRAINT "history_tags_history_id_fkey" FOREIGN KEY ("history_id") REFERENCES "histories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "history_tags" ADD CONSTRAINT "history_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
