/*
  Warnings:

  - You are about to drop the `Test` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Test";

-- CreateTable
CREATE TABLE "Count" (
    "id" SERIAL NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "modifiedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Count_pkey" PRIMARY KEY ("id")
);
