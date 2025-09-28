-- AlterTable
ALTER TABLE "public"."Account" ADD COLUMN     "refresh_token_expires_in" INTEGER;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "password" TEXT;

-- CreateTable
CREATE TABLE "public"."TopicUsage" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "videoId" TEXT,

    CONSTRAINT "TopicUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TopicUsage_videoId_key" ON "public"."TopicUsage"("videoId");

-- CreateIndex
CREATE UNIQUE INDEX "TopicUsage_classId_subjectId_topicId_usedAt_key" ON "public"."TopicUsage"("classId", "subjectId", "topicId", "usedAt");

-- AddForeignKey
ALTER TABLE "public"."TopicUsage" ADD CONSTRAINT "TopicUsage_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "public"."Video"("id") ON DELETE SET NULL ON UPDATE CASCADE;
