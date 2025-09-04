-- CreateEnum
CREATE TYPE "TimeslotStatus" AS ENUM ('OPEN', 'SEALED', 'SETTLED');

-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('PENDING', 'CONFIRMED', 'MATCHED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SupplyStatus" AS ENUM ('COMMITTED', 'CONFIRMED', 'ALLOCATED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BID_PLACED', 'SUPPLY_COMMITTED', 'BID_MATCHED', 'PAYMENT_SETTLED', 'ESCROW_RELEASED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_nonces" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "walletAddress" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_nonces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeslots" (
    "id" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "TimeslotStatus" NOT NULL DEFAULT 'OPEN',
    "clearingPrice" DECIMAL(10,4),
    "totalEnergy" DECIMAL(10,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timeslots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bids" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timeslotId" TEXT NOT NULL,
    "price" DECIMAL(10,4) NOT NULL,
    "quantity" DECIMAL(10,4) NOT NULL,
    "status" "BidStatus" NOT NULL DEFAULT 'PENDING',
    "txSignature" TEXT,
    "escrowAccount" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplies" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timeslotId" TEXT NOT NULL,
    "quantity" DECIMAL(10,4) NOT NULL,
    "reservePrice" DECIMAL(10,4) NOT NULL,
    "status" "SupplyStatus" NOT NULL DEFAULT 'COMMITTED',
    "txSignature" TEXT,
    "escrowAccount" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timeslotId" TEXT,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(18,9) NOT NULL,
    "txSignature" TEXT NOT NULL,
    "blockTime" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_walletAddress_key" ON "users"("walletAddress");

-- CreateIndex
CREATE INDEX "users_walletAddress_idx" ON "users"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "auth_nonces_nonce_key" ON "auth_nonces"("nonce");

-- CreateIndex
CREATE INDEX "auth_nonces_walletAddress_idx" ON "auth_nonces"("walletAddress");

-- CreateIndex
CREATE INDEX "auth_nonces_nonce_idx" ON "auth_nonces"("nonce");

-- CreateIndex
CREATE INDEX "auth_nonces_expiresAt_idx" ON "auth_nonces"("expiresAt");

-- CreateIndex
CREATE INDEX "timeslots_startTime_endTime_idx" ON "timeslots"("startTime", "endTime");

-- CreateIndex
CREATE INDEX "timeslots_status_idx" ON "timeslots"("status");

-- CreateIndex
CREATE INDEX "bids_userId_idx" ON "bids"("userId");

-- CreateIndex
CREATE INDEX "bids_timeslotId_idx" ON "bids"("timeslotId");

-- CreateIndex
CREATE INDEX "bids_status_idx" ON "bids"("status");

-- CreateIndex
CREATE INDEX "supplies_userId_idx" ON "supplies"("userId");

-- CreateIndex
CREATE INDEX "supplies_timeslotId_idx" ON "supplies"("timeslotId");

-- CreateIndex
CREATE INDEX "supplies_status_idx" ON "supplies"("status");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_txSignature_key" ON "transactions"("txSignature");

-- CreateIndex
CREATE INDEX "transactions_userId_idx" ON "transactions"("userId");

-- CreateIndex
CREATE INDEX "transactions_txSignature_idx" ON "transactions"("txSignature");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- AddForeignKey
ALTER TABLE "auth_nonces" ADD CONSTRAINT "auth_nonces_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_timeslotId_fkey" FOREIGN KEY ("timeslotId") REFERENCES "timeslots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplies" ADD CONSTRAINT "supplies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplies" ADD CONSTRAINT "supplies_timeslotId_fkey" FOREIGN KEY ("timeslotId") REFERENCES "timeslots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_timeslotId_fkey" FOREIGN KEY ("timeslotId") REFERENCES "timeslots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
