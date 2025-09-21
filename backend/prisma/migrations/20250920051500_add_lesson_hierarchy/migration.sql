-- CreateTable
CREATE TABLE "public"."Lesson" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subjectId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- Add column lessonId to Topic table
ALTER TABLE "public"."Topic" ADD COLUMN "lessonId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "public"."Topic" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- Add column lessonId to Question table
ALTER TABLE "public"."Question" ADD COLUMN "lessonId" TEXT;

-- Add column lessonId to LMSContent table
ALTER TABLE "public"."lms_content" ADD COLUMN "lessonId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_subjectId_name_key" ON "public"."Lesson"("subjectId", "name");
CREATE UNIQUE INDEX "Lesson_subjectId_order_key" ON "public"."Lesson"("subjectId", "order");
CREATE UNIQUE INDEX "Topic_lessonId_name_key" ON "public"."Topic"("lessonId", "name");
CREATE UNIQUE INDEX "Topic_lessonId_order_key" ON "public"."Topic"("lessonId", "order");

-- AddForeignKey
ALTER TABLE "public"."Lesson" ADD CONSTRAINT "Lesson_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Topic" ADD CONSTRAINT "Topic_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "public"."Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Question" ADD CONSTRAINT "Question_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "public"."Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."lms_content" ADD CONSTRAINT "lms_content_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "public"."Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create default lessons for existing subjects
-- This will create a default lesson for each subject to maintain data integrity
INSERT INTO "public"."Lesson" (id, name, description, "subjectId", "order")
SELECT 
    'default_lesson_' || s.id as id,
    s.name || ' - General' as name,
    'Default lesson for ' || s.name as description,
    s.id as "subjectId",
    0 as "order"
FROM "public"."Subject" s;

-- Update existing topics to reference the default lesson
UPDATE "public"."Topic" 
SET "lessonId" = 'default_lesson_' || "subjectId"
WHERE "lessonId" = '';

-- Update existing questions to reference the default lesson
UPDATE "public"."Question" 
SET "lessonId" = 'default_lesson_' || "subjectId"
WHERE "subjectId" IS NOT NULL AND "lessonId" IS NULL;

-- Update existing LMS content to reference the default lesson
UPDATE "public"."lms_content" 
SET "lessonId" = 'default_lesson_' || "subjectId"
WHERE "subjectId" IS NOT NULL AND "lessonId" IS NULL;

-- Remove the default value constraint after data migration
ALTER TABLE "public"."Topic" ALTER COLUMN "lessonId" DROP DEFAULT;

