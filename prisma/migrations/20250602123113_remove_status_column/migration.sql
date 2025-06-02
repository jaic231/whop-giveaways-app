/*
  Warnings:

  - You are about to drop the column `status` on the `giveaways` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "giveaways" DROP COLUMN "status";

-- DropEnum
DROP TYPE "GiveawayStatus";
