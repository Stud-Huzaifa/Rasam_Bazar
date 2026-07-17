CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'VENDOR_RESPONDED', 'RESOLVED', 'ESCALATED', 'CANCELLED');

ALTER TABLE "BookingDispute"
  ADD COLUMN "evidenceUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "vendorResponse" TEXT,
  ADD COLUMN "supportNote" TEXT,
  ADD COLUMN "adminDecision" TEXT,
  ADD COLUMN "reviewedById" TEXT,
  ADD COLUMN "decidedById" TEXT;

CREATE TABLE "DisputeEvidence" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "uploadedById" TEXT,
    "fileUrl" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeEvidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BookingIncident" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "openedById" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "vendorResponse" TEXT,
    "resolutionNote" TEXT,
    "escalatedDisputeId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingIncident_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IncidentEvidence" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "uploadedById" TEXT,
    "fileUrl" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentEvidence_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DisputeEvidence_disputeId_idx" ON "DisputeEvidence"("disputeId");
CREATE INDEX "BookingIncident_bookingId_status_idx" ON "BookingIncident"("bookingId", "status");
CREATE INDEX "BookingIncident_vendorId_status_idx" ON "BookingIncident"("vendorId", "status");
CREATE INDEX "BookingIncident_customerId_status_idx" ON "BookingIncident"("customerId", "status");
CREATE INDEX "IncidentEvidence_incidentId_idx" ON "IncidentEvidence"("incidentId");

ALTER TABLE "DisputeEvidence" ADD CONSTRAINT "DisputeEvidence_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "BookingDispute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BookingIncident" ADD CONSTRAINT "BookingIncident_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BookingIncident" ADD CONSTRAINT "BookingIncident_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BookingIncident" ADD CONSTRAINT "BookingIncident_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IncidentEvidence" ADD CONSTRAINT "IncidentEvidence_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "BookingIncident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
