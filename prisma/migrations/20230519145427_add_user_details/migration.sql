-- AlterTable
ALTER TABLE "User" ADD COLUMN     "firstName" TEXT NOT NULL DEFAULT 'Name',
ADD COLUMN     "lastName" TEXT NOT NULL DEFAULT 'Name';
