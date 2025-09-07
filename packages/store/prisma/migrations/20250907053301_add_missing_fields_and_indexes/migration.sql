-- DropForeignKey
ALTER TABLE "Website" DROP CONSTRAINT "Website_user_id_fkey";

-- DropForeignKey
ALTER TABLE "WebsiteTick" DROP CONSTRAINT "WebsiteTick_region_id_fkey";

-- DropForeignKey
ALTER TABLE "WebsiteTick" DROP CONSTRAINT "WebsiteTick_website_id_fkey";

-- AlterTable
ALTER TABLE "Region" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Website" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "timeAdded" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Website_user_id_idx" ON "Website"("user_id");

-- CreateIndex
CREATE INDEX "Website_isActive_idx" ON "Website"("isActive");

-- CreateIndex
CREATE INDEX "WebsiteTick_website_id_createdAt_idx" ON "WebsiteTick"("website_id", "createdAt");

-- CreateIndex
CREATE INDEX "WebsiteTick_region_id_createdAt_idx" ON "WebsiteTick"("region_id", "createdAt");

-- CreateIndex
CREATE INDEX "WebsiteTick_status_createdAt_idx" ON "WebsiteTick"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "Website" ADD CONSTRAINT "Website_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteTick" ADD CONSTRAINT "WebsiteTick_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteTick" ADD CONSTRAINT "WebsiteTick_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;
