/*
  Warnings:

  - You are about to drop the `AdminInfo` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "AdminInfo";

-- CreateTable
CREATE TABLE "supplierInfo" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplierInfo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "supplierInfo" ADD CONSTRAINT "supplierInfo_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
