CREATE TYPE "GuestSide" AS ENUM ('BRIDE', 'GROOM', 'SHARED');
CREATE TYPE "GuestRsvpStatus" AS ENUM ('PENDING', 'INVITED', 'ACCEPTED', 'DECLINED', 'MAYBE');
CREATE TYPE "VendorOperationStatus" AS ENUM ('SCHEDULED', 'ON_THE_WAY', 'ARRIVED', 'SETTING_UP', 'READY', 'ACTIVE_SERVICE', 'COMPLETED', 'DELAYED');

ALTER TYPE "MessageThreadType" ADD VALUE IF NOT EXISTS 'PROPOSAL';
ALTER TYPE "MessageThreadType" ADD VALUE IF NOT EXISTS 'DISPUTE';

CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relation" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "side" "GuestSide" NOT NULL DEFAULT 'SHARED',
    "groupName" TEXT,
    "adults" INTEGER NOT NULL DEFAULT 1,
    "children" INTEGER NOT NULL DEFAULT 0,
    "additionalEstimate" INTEGER NOT NULL DEFAULT 0,
    "dietaryNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GuestEventInvitation" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "rsvpStatus" "GuestRsvpStatus" NOT NULL DEFAULT 'PENDING',
    "invitedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestEventInvitation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Notification"
  ADD COLUMN "emailTo" TEXT,
  ADD COLUMN "emailStatus" TEXT,
  ADD COLUMN "emailFallback" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "MessageThread"
  ADD COLUMN "proposalId" TEXT,
  ADD COLUMN "disputeId" TEXT;

ALTER TABLE "Message"
  ADD COLUMN "isSystem" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "metadata" JSONB;

CREATE TABLE "BookingOperationStatus" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "status" "VendorOperationStatus" NOT NULL,
    "note" TEXT,
    "delayReason" TEXT,
    "actorId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingOperationStatus_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Guest_weddingId_side_idx" ON "Guest"("weddingId", "side");
CREATE INDEX "Guest_weddingId_groupName_idx" ON "Guest"("weddingId", "groupName");
CREATE UNIQUE INDEX "GuestEventInvitation_guestId_eventId_key" ON "GuestEventInvitation"("guestId", "eventId");
CREATE INDEX "GuestEventInvitation_eventId_rsvpStatus_idx" ON "GuestEventInvitation"("eventId", "rsvpStatus");
CREATE INDEX "MessageThread_proposalId_idx" ON "MessageThread"("proposalId");
CREATE INDEX "MessageThread_disputeId_idx" ON "MessageThread"("disputeId");
CREATE INDEX "MessageThread_serviceRequestId_idx" ON "MessageThread"("serviceRequestId");
CREATE INDEX "BookingOperationStatus_bookingId_occurredAt_idx" ON "BookingOperationStatus"("bookingId", "occurredAt");
CREATE INDEX "BookingOperationStatus_status_idx" ON "BookingOperationStatus"("status");

ALTER TABLE "Guest" ADD CONSTRAINT "Guest_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GuestEventInvitation" ADD CONSTRAINT "GuestEventInvitation_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GuestEventInvitation" ADD CONSTRAINT "GuestEventInvitation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "WeddingEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MessageThread" ADD CONSTRAINT "MessageThread_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MessageThread" ADD CONSTRAINT "MessageThread_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "BookingDispute"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BookingOperationStatus" ADD CONSTRAINT "BookingOperationStatus_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
