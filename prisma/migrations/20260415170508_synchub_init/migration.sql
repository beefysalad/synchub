/*
  Warnings:

  - You are about to drop the column `clerkId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `hashedPassword` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Count` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[clerkUserId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `clerkUserId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AccountProvider" AS ENUM ('GITHUB', 'TELEGRAM', 'DISCORD');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'SENT', 'CANCELED', 'FAILED');

-- DropIndex
DROP INDEX "User_clerkId_key";

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "clerkId",
DROP COLUMN "email",
DROP COLUMN "emailVerified",
DROP COLUMN "hashedPassword",
DROP COLUMN "image",
DROP COLUMN "name",
ADD COLUMN     "clerkUserId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Count";

-- CreateTable
CREATE TABLE "LinkedAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AccountProvider" NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "username" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "chatId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkedAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "provider" "AccountProvider" NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "issueNumber" INTEGER NOT NULL,
    "repository" TEXT NOT NULL,
    "remindAt" TIMESTAMP(3) NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LinkedAccount_userId_provider_idx" ON "LinkedAccount"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedAccount_provider_providerUserId_key" ON "LinkedAccount"("provider", "providerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "PendingLink_token_key" ON "PendingLink"("token");

-- CreateIndex
CREATE INDEX "PendingLink_userId_provider_idx" ON "PendingLink"("userId", "provider");

-- CreateIndex
CREATE INDEX "PendingLink_provider_expiresAt_idx" ON "PendingLink"("provider", "expiresAt");

-- CreateIndex
CREATE INDEX "Reminder_userId_status_idx" ON "Reminder"("userId", "status");

-- CreateIndex
CREATE INDEX "Reminder_repository_issueNumber_idx" ON "Reminder"("repository", "issueNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");

-- AddForeignKey
ALTER TABLE "LinkedAccount" ADD CONSTRAINT "LinkedAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingLink" ADD CONSTRAINT "PendingLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
