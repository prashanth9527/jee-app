-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."OtpType" ADD VALUE 'EMAIL_CHANGE';
ALTER TYPE "public"."OtpType" ADD VALUE 'PHONE_CHANGE';

-- AlterTable
ALTER TABLE "public"."Otp" ADD COLUMN     "metadata" TEXT,
ADD COLUMN     "used" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "target" DROP NOT NULL;
