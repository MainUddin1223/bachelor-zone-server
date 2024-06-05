/*
  Warnings:

  - Added the required column `contact_no` to the `supplierInfo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "supplierInfo" ADD COLUMN     "contact_no" TEXT NOT NULL;
