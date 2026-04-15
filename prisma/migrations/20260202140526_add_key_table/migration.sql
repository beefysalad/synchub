/*
  Warnings:

  - A unique constraint covering the columns `[key]` on the table `Count` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Count" ADD COLUMN     "key" TEXT NOT NULL DEFAULT 'global_counter';

-- CreateIndex
CREATE UNIQUE INDEX "Count_key_key" ON "Count"("key");
