-- AlterTable
ALTER TABLE "PDFJob" ADD COLUMN     "emailSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userEmail" TEXT;

-- CreateIndex
CREATE INDEX "PDFJob_userEmail_idx" ON "PDFJob"("userEmail");
