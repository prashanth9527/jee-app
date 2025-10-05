-- CreateEnum
CREATE TYPE "public"."RecordType" AS ENUM ('pyq', 'question', 'lms');

-- AlterTable
ALTER TABLE "public"."pdf_processor_cache" ADD COLUMN     "recordType" "public"."RecordType" NOT NULL DEFAULT 'pyq';
