-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PUBLISHED', 'HIDDEN', 'FLAGGED', 'REMOVED');

-- CreateEnum
CREATE TYPE "ReviewVisibility" AS ENUM ('PUBLIC', 'PRIVATE_TO_VENDOR');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TrustSignalType" AS ENUM ('REVIEW_SCORE', 'COMPLETED_BOOKINGS', 'VERIFICATION', 'DISPUTE_RATE', 'PROFILE_COMPLETENESS');

-- CreateTable
CREATE TABLE "VendorReview" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "communicationRating" INTEGER,
    "qualityRating" INTEGER,
    "valueRating" INTEGER,
    "professionalismRating" INTEGER,
    "title" TEXT,
    "comment" TEXT,
    "wouldRecommend" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
    "visibility" "ReviewVisibility" NOT NULL DEFAULT 'PUBLIC',
    "vendorResponse" TEXT,
    "vendorRespondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingDispute" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "openedById" TEXT,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolutionNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingDispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorTrustSignal" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "type" "TrustSignalType" NOT NULL,
    "label" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "source" TEXT,
    "details" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorTrustSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorReview_bookingId_key" ON "VendorReview"("bookingId");

-- CreateIndex
CREATE INDEX "VendorReview_vendorId_status_idx" ON "VendorReview"("vendorId", "status");

-- CreateIndex
CREATE INDEX "VendorReview_customerId_idx" ON "VendorReview"("customerId");

-- CreateIndex
CREATE INDEX "BookingDispute_bookingId_status_idx" ON "BookingDispute"("bookingId", "status");

-- CreateIndex
CREATE INDEX "BookingDispute_vendorId_status_idx" ON "BookingDispute"("vendorId", "status");

-- CreateIndex
CREATE INDEX "BookingDispute_customerId_status_idx" ON "BookingDispute"("customerId", "status");

-- CreateIndex
CREATE INDEX "VendorTrustSignal_vendorId_type_idx" ON "VendorTrustSignal"("vendorId", "type");

-- AddForeignKey
ALTER TABLE "VendorReview" ADD CONSTRAINT "VendorReview_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorReview" ADD CONSTRAINT "VendorReview_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorReview" ADD CONSTRAINT "VendorReview_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingDispute" ADD CONSTRAINT "BookingDispute_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingDispute" ADD CONSTRAINT "BookingDispute_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingDispute" ADD CONSTRAINT "BookingDispute_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorTrustSignal" ADD CONSTRAINT "VendorTrustSignal_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
