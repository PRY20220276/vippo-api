/*
  Warnings:

  - You are about to drop the column `description` on the `Video` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Video" DROP COLUMN "description",
ADD COLUMN     "url" TEXT;
