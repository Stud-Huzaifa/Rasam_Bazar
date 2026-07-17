CREATE TYPE "VendorInquiryStatus" AS ENUM ('NEW', 'RESPONDED', 'CLOSED');

CREATE TABLE "VendorInquiry" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "customerId" TEXT,
    "weddingId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "city" TEXT,
    "eventDate" TIMESTAMP(3),
    "guestCount" INTEGER,
    "message" TEXT NOT NULL,
    "status" "VendorInquiryStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VendorInquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VendorInquiry_vendorId_status_idx" ON "VendorInquiry"("vendorId", "status");
CREATE INDEX "VendorInquiry_customerId_idx" ON "VendorInquiry"("customerId");

ALTER TABLE "VendorInquiry" ADD CONSTRAINT "VendorInquiry_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VendorInquiry" ADD CONSTRAINT "VendorInquiry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
