-- DropForeignKey
ALTER TABLE "public"."blogs" DROP CONSTRAINT "blogs_categoryId_fkey";

-- AlterTable
ALTER TABLE "public"."blogs" ALTER COLUMN "categoryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."blogs" ADD CONSTRAINT "blogs_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."blog_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
