/*
  Warnings:

  - Added the required column `color_hex` to the `tags` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tags" ADD COLUMN     "color_hex" TEXT NOT NULL;
