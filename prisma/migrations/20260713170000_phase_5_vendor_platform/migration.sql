CREATE TYPE "PricingModel" AS ENUM ('FIXED', 'PER_EVENT', 'PER_HOUR', 'PER_GUEST', 'STARTING_FROM', 'CUSTOM_QUOTE');
CREATE TYPE "VendorAvailabilityStatus" AS ENUM ('AVAILABLE', 'TENTATIVELY_RESERVED', 'BOOKED', 'UNAVAILABLE', 'PARTIALLY_AVAILABLE');
CREATE TYPE "VerificationDocumentType" AS ENUM ('CNIC', 'ADDRESS_PROOF', 'BUSINESS_REGISTRATION', 'BANK_ACCOUNT', 'PORTFOLIO', 'CLIENT_REFERENCE', 'OTHER');

CREATE TABLE "VendorVerification" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "documentType" "VerificationDocumentType" NOT NULL,
    "documentUrl" TEXT,
    "notes" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VendorVerification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VendorPortfolio" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "description" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VendorPortfolio_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VendorTeam" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VendorTeam_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceListing" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "categoryId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "pricingModel" "PricingModel" NOT NULL DEFAULT 'STARTING_FROM',
    "startingPrice" DECIMAL(12,2),
    "serviceAreas" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "capacity" INTEGER,
    "inclusions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "exclusions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "addOns" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "leadTimeDays" INTEGER,
    "cancellationPolicy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ServiceListing_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServicePackage" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "serviceId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2),
    "includedItems" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "excludedItems" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "addOns" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "eventCoverage" TEXT,
    "teamSize" INTEGER,
    "deliveryTimeline" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ServicePackage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VendorAvailability" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "teamId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "status" "VendorAvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VendorAvailability_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VendorVerification_vendorId_status_idx" ON "VendorVerification"("vendorId", "status");
CREATE INDEX "VendorPortfolio_vendorId_isFeatured_idx" ON "VendorPortfolio"("vendorId", "isFeatured");
CREATE INDEX "ServiceListing_vendorId_isActive_idx" ON "ServiceListing"("vendorId", "isActive");
CREATE INDEX "ServiceListing_categoryId_idx" ON "ServiceListing"("categoryId");
CREATE INDEX "ServicePackage_vendorId_isActive_idx" ON "ServicePackage"("vendorId", "isActive");
CREATE INDEX "ServicePackage_serviceId_idx" ON "ServicePackage"("serviceId");
CREATE INDEX "VendorAvailability_vendorId_date_status_idx" ON "VendorAvailability"("vendorId", "date", "status");
CREATE INDEX "VendorAvailability_teamId_date_idx" ON "VendorAvailability"("teamId", "date");

ALTER TABLE "VendorVerification" ADD CONSTRAINT "VendorVerification_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VendorPortfolio" ADD CONSTRAINT "VendorPortfolio_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VendorTeam" ADD CONSTRAINT "VendorTeam_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceListing" ADD CONSTRAINT "ServiceListing_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceListing" ADD CONSTRAINT "ServiceListing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServicePackage" ADD CONSTRAINT "ServicePackage_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServicePackage" ADD CONSTRAINT "ServicePackage_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ServiceListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VendorAvailability" ADD CONSTRAINT "VendorAvailability_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VendorAvailability" ADD CONSTRAINT "VendorAvailability_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "VendorTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
