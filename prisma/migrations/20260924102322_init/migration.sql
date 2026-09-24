-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('daily', 'weekly');

-- CreateEnum
CREATE TYPE "DetailLevel" AS ENUM ('short', 'standard', 'detailed');

-- CreateEnum
CREATE TYPE "DeliveryKind" AS ENUM ('discord', 'slack');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('queued', 'running', 'succeeded', 'failed');

-- CreateEnum
CREATE TYPE "ItemCategory" AS ENUM ('release', 'announcement', 'article', 'security', 'trend');

-- CreateEnum
CREATE TYPE "Feedback" AS ENUM ('useful', 'not_useful');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "locale" TEXT NOT NULL DEFAULT 'fr',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Paris',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "last4" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'claude-sonnet-5',
    "validatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "keywords" TEXT[],
    "includeDomains" TEXT[],
    "excludeDomains" TEXT[],
    "detailLevel" "DetailLevel" NOT NULL DEFAULT 'standard',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "frequency" "Frequency" NOT NULL DEFAULT 'daily',
    "weekday" INTEGER,
    "hour" INTEGER NOT NULL DEFAULT 8,
    "nextRunAt" TIMESTAMP(3),
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "DeliveryKind" NOT NULL,
    "urlCiphertext" TEXT NOT NULL,
    "urlIv" TEXT NOT NULL,
    "urlAuthTag" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Run" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "RunStatus" NOT NULL DEFAULT 'queued',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "searches" INTEGER NOT NULL DEFAULT 0,
    "costUsd" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Digest" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Digest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "digestId" TEXT NOT NULL,
    "topicId" TEXT,
    "title" TEXT NOT NULL,
    "category" "ItemCategory" NOT NULL,
    "summary" TEXT NOT NULL,
    "whyItMatters" TEXT NOT NULL,
    "relevance" INTEGER NOT NULL,
    "urlHash" TEXT NOT NULL,
    "feedback" "Feedback",
    "starred" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "citedText" TEXT,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_userId_key" ON "ApiKey"("userId");

-- CreateIndex
CREATE INDEX "Topic_userId_idx" ON "Topic"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_userId_key" ON "Schedule"("userId");

-- CreateIndex
CREATE INDEX "Schedule_nextRunAt_idx" ON "Schedule"("nextRunAt");

-- CreateIndex
CREATE INDEX "Delivery_userId_idx" ON "Delivery"("userId");

-- CreateIndex
CREATE INDEX "Run_userId_createdAt_idx" ON "Run"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Digest_runId_key" ON "Digest"("runId");

-- CreateIndex
CREATE INDEX "Digest_userId_createdAt_idx" ON "Digest"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Item_digestId_idx" ON "Item"("digestId");

-- CreateIndex
CREATE INDEX "Item_urlHash_idx" ON "Item"("urlHash");

-- CreateIndex
CREATE INDEX "Source_itemId_idx" ON "Source"("itemId");

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Digest" ADD CONSTRAINT "Digest_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Digest" ADD CONSTRAINT "Digest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_digestId_fkey" FOREIGN KEY ("digestId") REFERENCES "Digest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
