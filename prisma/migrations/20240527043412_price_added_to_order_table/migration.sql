-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'supplier';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "price" INTEGER NOT NULL DEFAULT 89;
