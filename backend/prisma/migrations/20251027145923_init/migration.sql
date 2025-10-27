-- AlterTable
ALTER TABLE "public"."ExamPaper" ADD COLUMN     "pdfProcessorCacheId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."ExamPaper" ADD CONSTRAINT "ExamPaper_pdfProcessorCacheId_fkey" FOREIGN KEY ("pdfProcessorCacheId") REFERENCES "public"."pdf_processor_cache"("id") ON DELETE SET NULL ON UPDATE CASCADE;
