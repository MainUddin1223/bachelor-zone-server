/*
  Warnings:

  - Added the required column `supplier_id` to the `address` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplier_id` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receiver_id` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('paid', 'pending');

-- AlterTable
ALTER TABLE "address" ADD COLUMN     "supplier_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "supplier_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "receiver_id" INTEGER NOT NULL,
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'paid';

-- AddForeignKey
ALTER TABLE "address" ADD CONSTRAINT "address_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplierInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplierInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "supplierInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
