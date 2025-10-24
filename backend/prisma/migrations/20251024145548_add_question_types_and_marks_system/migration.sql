-- CreateEnum
CREATE TYPE "public"."QuestionType" AS ENUM ('MCQ_SINGLE', 'MCQ_MULTIPLE', 'OPEN_ENDED', 'PARAGRAPH');

-- CreateEnum
CREATE TYPE "public"."ExamType" AS ENUM ('REGULAR', 'AI_EXAM', 'CONTENT_EXAM', 'PRACTICE_EXAM', 'PYQ_PRACTICE');

-- CreateEnum
CREATE TYPE "public"."AIFeatureType" AS ENUM ('AI_QUESTIONS', 'PERFORMANCE_ANALYSIS', 'SUMMARY', 'MINDMAP', 'ANALYTICS_REFRESH', 'LESSON_SUMMARY', 'TOPIC_EXPLANATION', 'MICRO_LESSON');

-- AlterEnum
ALTER TYPE "public"."ContentStatus" ADD VALUE 'APPROVED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."ProgressStatus" ADD VALUE 'REVIEW';
ALTER TYPE "public"."ProgressStatus" ADD VALUE 'REVISIT';

-- AlterTable
ALTER TABLE "public"."ExamAnswer" ADD COLUMN     "numericValue" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."ExamPaper" ADD COLUMN     "contentId" TEXT,
ADD COLUMN     "examType" "public"."ExamType" NOT NULL DEFAULT 'REGULAR';

-- AlterTable
ALTER TABLE "public"."Question" ADD COLUMN     "allowPartialMarking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "answerTolerance" DOUBLE PRECISION DEFAULT 0.01,
ADD COLUMN     "correctNumericAnswer" DOUBLE PRECISION,
ADD COLUMN     "exerciseName" TEXT,
ADD COLUMN     "formulaid" TEXT,
ADD COLUMN     "fullMarks" DOUBLE PRECISION DEFAULT 4.0,
ADD COLUMN     "isOpenEnded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "negativeMarks" DOUBLE PRECISION DEFAULT -2.0,
ADD COLUMN     "parentQuestionId" TEXT,
ADD COLUMN     "partialMarks" DOUBLE PRECISION DEFAULT 2.0,
ADD COLUMN     "questionType" "public"."QuestionType" NOT NULL DEFAULT 'MCQ_SINGLE',
ADD COLUMN     "section_name" TEXT;

-- AlterTable
ALTER TABLE "public"."lms_content" ADD COLUMN     "contentSummary" TEXT,
ADD COLUMN     "mindMap" TEXT,
ADD COLUMN     "videoLink" TEXT;

-- AlterTable
ALTER TABLE "public"."pdf_processor_cache" ADD COLUMN     "htmlContent" TEXT,
ADD COLUMN     "htmlFilePath" TEXT,
ADD COLUMN     "lmsContentId" TEXT,
ADD COLUMN     "pdfFilePath" TEXT;

-- CreateTable
CREATE TABLE "public"."subject_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "status" "public"."ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3),
    "lessonsCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalLessons" INTEGER NOT NULL DEFAULT 0,
    "contentCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalContent" INTEGER NOT NULL DEFAULT 0,
    "averageScore" DOUBLE PRECISION,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB,

    CONSTRAINT "subject_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."topic_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "status" "public"."ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3),
    "contentCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalContent" INTEGER NOT NULL DEFAULT 0,
    "subtopicsCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalSubtopics" INTEGER NOT NULL DEFAULT 0,
    "averageScore" DOUBLE PRECISION,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB,

    CONSTRAINT "topic_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subtopic_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subtopicId" TEXT NOT NULL,
    "status" "public"."ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3),
    "contentCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalContent" INTEGER NOT NULL DEFAULT 0,
    "averageScore" DOUBLE PRECISION,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB,

    CONSTRAINT "subtopic_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."content_performance_analysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "subjectId" TEXT,
    "topicId" TEXT,
    "subtopicId" TEXT,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageScore" DOUBLE PRECISION,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "strengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "weaknesses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "suggestions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "difficultyLevel" TEXT,
    "learningStyle" TEXT,
    "lastAnalyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analysisVersion" TEXT NOT NULL DEFAULT '1.0',
    "aiModel" TEXT NOT NULL DEFAULT 'gpt-4',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_performance_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_feature_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "featureType" "public"."AIFeatureType" NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_feature_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_generated_results" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "featureType" "public"."AIFeatureType" NOT NULL,
    "resultData" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_generated_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_content_generations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT,
    "topicId" TEXT,
    "subtopicId" TEXT,
    "contentType" TEXT NOT NULL,
    "contentData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_content_generations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subject_progress_userId_subjectId_key" ON "public"."subject_progress"("userId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "topic_progress_userId_topicId_key" ON "public"."topic_progress"("userId", "topicId");

-- CreateIndex
CREATE UNIQUE INDEX "subtopic_progress_userId_subtopicId_key" ON "public"."subtopic_progress"("userId", "subtopicId");

-- CreateIndex
CREATE UNIQUE INDEX "content_performance_analysis_userId_contentId_key" ON "public"."content_performance_analysis"("userId", "contentId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_feature_usage_userId_contentId_featureType_key" ON "public"."ai_feature_usage"("userId", "contentId", "featureType");

-- CreateIndex
CREATE UNIQUE INDEX "ai_generated_results_userId_contentId_featureType_version_key" ON "public"."ai_generated_results"("userId", "contentId", "featureType", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ai_content_generations_userId_lessonId_contentType_key" ON "public"."ai_content_generations"("userId", "lessonId", "contentType");

-- CreateIndex
CREATE UNIQUE INDEX "ai_content_generations_userId_topicId_contentType_key" ON "public"."ai_content_generations"("userId", "topicId", "contentType");

-- CreateIndex
CREATE UNIQUE INDEX "ai_content_generations_userId_subtopicId_contentType_key" ON "public"."ai_content_generations"("userId", "subtopicId", "contentType");

-- AddForeignKey
ALTER TABLE "public"."Question" ADD CONSTRAINT "question_formulas_fk" FOREIGN KEY ("formulaid") REFERENCES "public"."formulas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Question" ADD CONSTRAINT "Question_parentQuestionId_fkey" FOREIGN KEY ("parentQuestionId") REFERENCES "public"."Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExamPaper" ADD CONSTRAINT "ExamPaper_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."lms_content"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subject_progress" ADD CONSTRAINT "subject_progress_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subject_progress" ADD CONSTRAINT "subject_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."topic_progress" ADD CONSTRAINT "topic_progress_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "public"."Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."topic_progress" ADD CONSTRAINT "topic_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subtopic_progress" ADD CONSTRAINT "subtopic_progress_subtopicId_fkey" FOREIGN KEY ("subtopicId") REFERENCES "public"."Subtopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subtopic_progress" ADD CONSTRAINT "subtopic_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pdf_processor_cache" ADD CONSTRAINT "pdf_processor_cache_lmsContentId_fkey" FOREIGN KEY ("lmsContentId") REFERENCES "public"."lms_content"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."content_performance_analysis" ADD CONSTRAINT "content_performance_analysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."content_performance_analysis" ADD CONSTRAINT "content_performance_analysis_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."lms_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."content_performance_analysis" ADD CONSTRAINT "content_performance_analysis_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."content_performance_analysis" ADD CONSTRAINT "content_performance_analysis_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "public"."Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."content_performance_analysis" ADD CONSTRAINT "content_performance_analysis_subtopicId_fkey" FOREIGN KEY ("subtopicId") REFERENCES "public"."Subtopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_feature_usage" ADD CONSTRAINT "ai_feature_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_feature_usage" ADD CONSTRAINT "ai_feature_usage_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."lms_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_generated_results" ADD CONSTRAINT "ai_generated_results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_generated_results" ADD CONSTRAINT "ai_generated_results_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."lms_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_content_generations" ADD CONSTRAINT "ai_content_generations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_content_generations" ADD CONSTRAINT "ai_content_generations_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "public"."Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_content_generations" ADD CONSTRAINT "ai_content_generations_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "public"."Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_content_generations" ADD CONSTRAINT "ai_content_generations_subtopicId_fkey" FOREIGN KEY ("subtopicId") REFERENCES "public"."Subtopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
