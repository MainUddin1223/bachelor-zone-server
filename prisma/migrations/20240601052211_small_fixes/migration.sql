-- CreateEnum
CREATE TYPE "PickupStatus" AS ENUM ('enable', 'disable', 'received');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "pickup_status" "PickupStatus" NOT NULL DEFAULT 'disable';
