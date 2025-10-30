-- CreateTable
CREATE TABLE "practice_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "current_question_index" INTEGER NOT NULL DEFAULT 0,
    "total_questions" INTEGER NOT NULL,
    "completed_questions" INTEGER NOT NULL DEFAULT 0,
    "visited_questions" JSONB NOT NULL DEFAULT '[]',
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_accessed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "practice_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_sessions" (
    "id" TEXT NOT NULL,
    "progress_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "user_answer" JSONB,
    "is_correct" BOOLEAN,
    "time_spent" INTEGER DEFAULT 0,
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_checked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "practice_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "practice_progress_user_content_key" ON "practice_progress"("user_id", "content_type", "content_id");

-- CreateIndex
CREATE INDEX "practice_progress_user_id_idx" ON "practice_progress"("user_id");

-- CreateIndex
CREATE INDEX "practice_progress_content_idx" ON "practice_progress"("content_type", "content_id");

-- CreateIndex
CREATE INDEX "practice_sessions_progress_id_idx" ON "practice_sessions"("progress_id");

-- CreateIndex
CREATE INDEX "practice_sessions_question_id_idx" ON "practice_sessions"("question_id");

-- AddForeignKey
ALTER TABLE "practice_progress" ADD CONSTRAINT "practice_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_progress_id_fkey" FOREIGN KEY ("progress_id") REFERENCES "practice_progress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

