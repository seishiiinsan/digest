-- DropIndex
DROP INDEX "Delivery_userId_idx";

-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN     "hint" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_userId_key" ON "Delivery"("userId");

