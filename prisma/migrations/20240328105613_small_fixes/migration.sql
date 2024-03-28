/*
  Warnings:

  - Made the column `virtual_id` on table `userInfo` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "userInfo" ALTER COLUMN "virtual_id" SET NOT NULL;
