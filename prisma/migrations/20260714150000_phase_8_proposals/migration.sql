CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'VIEWED', 'SHORTLISTED', 'REVISION_REQUESTED', 'REVISED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN');

CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "latestVersionId" TEXT,
    "customerNote" TEXT,
    "shortlistedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProposalVersion" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "previousVersionId" TEXT,
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "packageDescription" TEXT,
    "inclusions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "exclusions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "addOns" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "teamSize" INTEGER,
    "setupTime" TEXT,
    "deliveryTime" TEXT,
    "advanceAmount" DECIMAL(12,2),
    "paymentSchedule" TEXT,
    "cancellationPolicy" TEXT,
    "validityDate" TIMESTAMP(3),
    "terms" TEXT,
    "changeSummary" TEXT,
    "attachments" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProposalVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProposalComment" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorRole" TEXT,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProposalComment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Proposal_serviceRequestId_vendorId_key" ON "Proposal"("serviceRequestId", "vendorId");
CREATE INDEX "Proposal_vendorId_status_idx" ON "Proposal"("vendorId", "status");
CREATE INDEX "Proposal_serviceRequestId_status_idx" ON "Proposal"("serviceRequestId", "status");
CREATE UNIQUE INDEX "ProposalVersion_proposalId_versionNumber_key" ON "ProposalVersion"("proposalId", "versionNumber");
CREATE INDEX "ProposalVersion_proposalId_idx" ON "ProposalVersion"("proposalId");
CREATE INDEX "ProposalComment_proposalId_idx" ON "ProposalComment"("proposalId");

ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProposalVersion" ADD CONSTRAINT "ProposalVersion_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProposalComment" ADD CONSTRAINT "ProposalComment_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
