/*
  Warnings:

  - Added the required column `password` to the `auth` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "auth" DROP CONSTRAINT "auth_addressId_fkey";

-- AlterTable
ALTER TABLE "auth" ADD COLUMN     "password" TEXT NOT NULL;
