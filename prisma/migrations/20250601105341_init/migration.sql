-- CreateEnum
CREATE TYPE "GiveawayStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "giveaways" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prizeAmount" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "GiveawayStatus" NOT NULL DEFAULT 'UPCOMING',
    "creatorId" TEXT NOT NULL,
    "creatorName" TEXT,
    "companyId" TEXT NOT NULL,
    "payoutId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "giveaways_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT,
    "giveawayId" TEXT NOT NULL,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "entries_userId_giveawayId_key" ON "entries"("userId", "giveawayId");

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_giveawayId_fkey" FOREIGN KEY ("giveawayId") REFERENCES "giveaways"("id") ON DELETE CASCADE ON UPDATE CASCADE;
