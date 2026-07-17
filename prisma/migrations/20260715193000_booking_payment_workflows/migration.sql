ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'SIMULATED_CARD';

ALTER TABLE "Booking"
  ADD COLUMN "acceptedProposalVersionId" TEXT,
  ADD COLUMN "agreementVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "lockedProposalSnapshot" JSONB,
  ADD COLUMN "budgetWarnings" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "BookingPayment"
  ADD COLUMN "receiptUrl" TEXT,
  ADD COLUMN "verifiedAt" TIMESTAMP(3),
  ADD COLUMN "verifiedById" TEXT,
  ADD COLUMN "verificationNote" TEXT;

CREATE TABLE "BookingEvent" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Booking_acceptedProposalVersionId_idx" ON "Booking"("acceptedProposalVersionId");
CREATE UNIQUE INDEX "BookingEvent_bookingId_eventId_key" ON "BookingEvent"("bookingId", "eventId");
CREATE INDEX "BookingEvent_eventId_idx" ON "BookingEvent"("eventId");

ALTER TABLE "Booking" ADD CONSTRAINT "Booking_acceptedProposalVersionId_fkey" FOREIGN KEY ("acceptedProposalVersionId") REFERENCES "ProposalVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BookingEvent" ADD CONSTRAINT "BookingEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BookingEvent" ADD CONSTRAINT "BookingEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "WeddingEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
