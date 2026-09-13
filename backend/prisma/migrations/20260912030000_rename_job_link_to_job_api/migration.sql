-- RenameEnumValue
ALTER TYPE "SearchSourceType" RENAME VALUE 'JOB_LINK' TO 'JOB_API';

-- AlterTable
ALTER TABLE "searches" ADD COLUMN "apiFilters" JSONB;
