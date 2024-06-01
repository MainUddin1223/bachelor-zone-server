-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('paid', 'pending');

-- CreateEnum
CREATE TYPE "PickupStatus" AS ENUM ('abailable', 'notAbailable', 'received');

-- AlterTable
ALTER TABLE "address" ADD COLUMN     "supplier_id" INTEGER NOT NULL DEFAULT 3;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "pickup_status" "PickupStatus" NOT NULL DEFAULT 'notAbailable',
ADD COLUMN     "supplier_id" INTEGER NOT NULL DEFAULT 3;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "receiver_id" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'paid';

-- AddForeignKey
ALTER TABLE "address" ADD CONSTRAINT "address_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplierInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplierInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "supplierInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
