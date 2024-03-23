/*
  Warnings:

  - You are about to drop the column `addressId` on the `auth` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `userInfo` table. All the data in the column will be lost.
  - Added the required column `name` to the `auth` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "auth" DROP COLUMN "addressId",
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "userInfo" DROP COLUMN "name";
