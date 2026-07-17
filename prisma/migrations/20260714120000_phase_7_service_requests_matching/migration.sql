CREATE TYPE "ServiceRequestStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'RECEIVING_PROPOSALS', 'SHORTLISTING', 'AWARDED', 'CLOSED', 'CANCELLED');
CREATE TYPE "ServiceRequestVisibility" AS ENUM ('PUBLIC_TO_MATCHING_VENDORS', 'INVITE_ONLY', 'PRIVATE');
CREATE TYPE "ServiceRequestInvitationStatus" AS ENUM ('INVITED', 'VIEWED', 'DECLINED', 'RESPONDED');

CREATE TABLE "ServiceRequest" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "eventId" TEXT,
    "categoryId" TEXT,
    "title" TEXT NOT NULL,
    "city" TEXT,
    "venue" TEXT,
    "eventDate" TIMESTAMP(3),
    "startTime" TEXT,
    "guestCount" INTEGER,
    "minBudget" DECIMAL(12,2),
    "maxBudget" DECIMAL(12,2),
    "description" TEXT NOT NULL,
    "deliverables" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "attachments" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "proposalDeadline" TIMESTAMP(3),
    "visibility" "ServiceRequestVisibility" NOT NULL DEFAULT 'PUBLIC_TO_MATCHING_VENDORS',
    "status" "ServiceRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceRequestInvitation" (
    "id" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "status" "ServiceRequestInvitationStatus" NOT NULL DEFAULT 'INVITED',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ServiceRequestInvitation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceRequestMatch" (
    "id" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "reasons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ServiceRequestMatch_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ServiceRequest_weddingId_status_idx" ON "ServiceRequest"("weddingId", "status");
CREATE INDEX "ServiceRequest_categoryId_city_idx" ON "ServiceRequest"("categoryId", "city");
CREATE INDEX "ServiceRequest_status_visibility_idx" ON "ServiceRequest"("status", "visibility");
CREATE UNIQUE INDEX "ServiceRequestInvitation_serviceRequestId_vendorId_key" ON "ServiceRequestInvitation"("serviceRequestId", "vendorId");
CREATE INDEX "ServiceRequestInvitation_vendorId_status_idx" ON "ServiceRequestInvitation"("vendorId", "status");
CREATE UNIQUE INDEX "ServiceRequestMatch_serviceRequestId_vendorId_key" ON "ServiceRequestMatch"("serviceRequestId", "vendorId");
CREATE INDEX "ServiceRequestMatch_vendorId_score_idx" ON "ServiceRequestMatch"("vendorId", "score");

ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "WeddingEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceRequestInvitation" ADD CONSTRAINT "ServiceRequestInvitation_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceRequestInvitation" ADD CONSTRAINT "ServiceRequestInvitation_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceRequestMatch" ADD CONSTRAINT "ServiceRequestMatch_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceRequestMatch" ADD CONSTRAINT "ServiceRequestMatch_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
