/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `supplierInfo` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "address" DROP CONSTRAINT "address_supplier_id_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "supplierInfo_user_id_key" ON "supplierInfo"("user_id");

-- AddForeignKey
ALTER TABLE "address" ADD CONSTRAINT "address_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplierInfo"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
