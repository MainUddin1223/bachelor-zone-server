-- DropForeignKey
ALTER TABLE "address" DROP CONSTRAINT "address_supplier_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_supplier_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_receiver_id_fkey";

-- AlterTable
ALTER TABLE "address" ALTER COLUMN "supplier_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "supplier_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "transactions" ALTER COLUMN "receiver_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "address" ADD CONSTRAINT "address_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplierInfo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplierInfo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "supplierInfo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
