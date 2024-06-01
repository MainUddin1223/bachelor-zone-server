-- AlterTable
ALTER TABLE "address" ALTER COLUMN "supplier_id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "supplier_id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "transactions" ALTER COLUMN "receiver_id" DROP DEFAULT;
