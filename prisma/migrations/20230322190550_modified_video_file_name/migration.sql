/*
  Warnings:

  - You are about to drop the column `name` on the `Video` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Video" DROP COLUMN "name",
ADD COLUMN     "fileName" TEXT NOT NULL DEFAULT 'name',
ADD COLUMN     "originalName" TEXT NOT NULL DEFAULT 'original';
