-- CreateEnum
CREATE TYPE "SearchSourceType" AS ENUM ('AMAZON_JOBS', 'AMAZON_WAREHOUSE', 'JOB_LINK', 'JOB_XPATH');

-- AlterTable
ALTER TABLE "searches" ADD COLUMN "sourceType" "SearchSourceType" NOT NULL DEFAULT 'AMAZON_JOBS';
ALTER TABLE "searches" ADD COLUMN "targetUrl" TEXT;
ALTER TABLE "searches" ADD COLUMN "xpath" TEXT;
