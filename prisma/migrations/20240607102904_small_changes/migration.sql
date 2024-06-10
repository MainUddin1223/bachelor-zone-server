-- DropForeignKey
ALTER TABLE "address" DROP CONSTRAINT "address_supplier_id_fkey";

-- DropIndex
DROP INDEX "supplierInfo_user_id_key";

-- AddForeignKey
ALTER TABLE "address" ADD CONSTRAINT "address_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplierInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
