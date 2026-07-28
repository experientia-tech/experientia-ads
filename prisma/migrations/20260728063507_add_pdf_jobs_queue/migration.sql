-- CreateEnum
CREATE TYPE "PDFJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "PDFJob" (
    "id" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "status" "PDFJobStatus" NOT NULL DEFAULT 'PENDING',
    "downloadUrl" TEXT,
    "expiresAt" TIMESTAMPTZ,
    "error" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMPTZ,

    CONSTRAINT "PDFJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PDFJob_status_createdAt_idx" ON "PDFJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PDFJob_campaignId_idx" ON "PDFJob"("campaignId");
