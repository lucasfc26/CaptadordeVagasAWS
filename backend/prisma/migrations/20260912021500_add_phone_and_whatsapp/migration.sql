-- AlterEnum
ALTER TYPE "NotificationChannel" ADD VALUE 'WHATSAPP';

-- AlterTable
ALTER TABLE "users" ADD COLUMN "phone" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "user_settings" ADD COLUMN "whatsappEnabled" BOOLEAN NOT NULL DEFAULT true;
