-- CreateEnum
CREATE TYPE "RunTrigger" AS ENUM ('manual', 'scheduled');

-- AlterTable
ALTER TABLE "Run" ADD COLUMN     "cacheReadTokens" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cacheWriteTokens" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "model" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "topicsDone" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "topicsTotal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trigger" "RunTrigger" NOT NULL DEFAULT 'manual';

