require('ts-node/register/transpile-only');

const assert = require('node:assert/strict');
const { BadRequestException, NotFoundException } = require('@nestjs/common');
const { ReviewsService } = require('../apps/api/src/reviews/reviews.service');
const { AdminService } = require('../apps/api/src/admin/admin.service');

class TrustPrisma {
  constructor() {
    this.users = [
      {
        id: 'admin-1',
        email: 'admin@test.local',
        fullName: 'Admin',
        deletedAt: null,
        isSuspended: false,
        isActive: true,
      },
      {
        id: 'customer-1',
        email: 'customer@test.local',
        fullName: 'Customer',
        deletedAt: null,
        isSuspended: false,
        isActive: true,
      },
      {
        id: 'customer-2',
        email: 'other@test.local',
        fullName: 'Other Customer',
        deletedAt: null,
        isSuspended: false,
        isActive: true,
      },
      {
        id: 'vendor-user-1',
        email: 'vendor@test.local',
        fullName: 'Vendor',
        deletedAt: null,
        isSuspended: false,
        isActive: true,
      },
    ];
    this.vendors = [
      {
        id: 'vendor-1',
        userId: 'vendor-user-1',
        businessName: 'Noor Studio',
        ownerName: 'Owner',
        city: 'Lahore',
        isActive: true,
        verificationStatus: 'APPROVED',
        verificationLevel: 'BUSINESS_VERIFIED',
      },
    ];
    this.bookings = [
      {
        id: 'booking-completed',
        customerId: 'customer-1',
        vendorId: 'vendor-1',
        status: 'COMPLETED',
        title: 'Completed booking',
      },
      {
        id: 'booking-confirmed',
        customerId: 'customer-1',
        vendorId: 'vendor-1',
        status: 'CONFIRMED',
        title: 'Confirmed booking',
      },
    ];
    this.reviews = [];
    this.disputes = [];
    this.disputeEvidenceRows = [];
    this.incidents = [];
    this.incidentEvidenceRows = [];
    this.trustSignals = [];
    this.auditLogs = [];
    this.payments = [];
    this.categories = [
      { id: 'cat-1', name: 'Photography', slug: 'photography' },
    ];
    this.listings = [
      {
        id: 'listing-1',
        vendorId: 'vendor-1',
        categoryId: 'cat-1',
        title: 'Wedding shoot',
        isActive: true,
      },
    ];
    this.verifications = [
      {
        id: 'verification-1',
        vendorId: 'vendor-1',
        status: 'PENDING',
        vendor: this.vendors[0],
      },
    ];
    this.activities = [];

    this.booking = {
      findFirst: async ({ where }) => {
        const booking = this.bookings.find((item) =>
          this.matchesBookingWhere(item, where),
        );
        return booking ? this.hydrateBooking(booking) : null;
      },
      count: async ({ where = {} } = {}) =>
        this.bookings.filter((item) => this.matchesBookingWhere(item, where))
          .length,
      findMany: async ({ where = {} } = {}) =>
        this.bookings
          .filter((item) => this.matchesBookingWhere(item, where))
          .map((item) => this.hydrateBooking(item)),
      update: async ({ where, data }) => {
        const booking = this.bookings.find((item) => item.id === where.id);
        Object.assign(booking, data);
        return this.hydrateBooking(booking);
      },
    };

    this.vendorReview = {
      create: async ({ data }) => {
        const review = {
          id: `review-${this.reviews.length + 1}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        this.reviews.push(review);
        return this.hydrateReview(review);
      },
      findUnique: async ({ where }) => {
        const review = this.reviews.find((item) =>
          where.id ? item.id === where.id : item.bookingId === where.bookingId,
        );
        return review ? this.hydrateReview(review) : null;
      },
      findFirst: async ({ where }) => {
        const review = this.reviews.find((item) =>
          this.matchesReviewWhere(item, where),
        );
        return review ? this.hydrateReview(review) : null;
      },
      findMany: async ({ where = {} } = {}) =>
        this.reviews
          .filter((item) => this.matchesReviewWhere(item, where))
          .map((item) => this.hydrateReview(item)),
      update: async ({ where, data }) => {
        const review = this.reviews.find((item) => item.id === where.id);
        Object.assign(review, data, { updatedAt: new Date() });
        return this.hydrateReview(review);
      },
      count: async ({ where = {} } = {}) =>
        this.reviews.filter((item) => this.matchesReviewWhere(item, where))
          .length,
    };

    this.vendor = {
      findUnique: async ({ where }) =>
        this.vendors.find((vendor) =>
          where.id ? vendor.id === where.id : vendor.userId === where.userId,
        ) || null,
      findMany: async () => this.vendors,
      count: async () => this.vendors.length,
      update: async ({ where, data }) => {
        const vendor = this.vendors.find((item) => item.id === where.id);
        Object.assign(vendor, data);
        return vendor;
      },
    };

    this.vendorTrustSignal = {
      findMany: async ({ where }) =>
        this.trustSignals.filter(
          (signal) => signal.vendorId === where.vendorId,
        ),
      deleteMany: async ({ where }) => {
        this.trustSignals = this.trustSignals.filter(
          (signal) => signal.vendorId !== where.vendorId,
        );
      },
      createMany: async ({ data }) => {
        this.trustSignals.push(...data);
        return { count: data.length };
      },
    };

    this.bookingDispute = {
      create: async ({ data }) => {
        const dispute = {
          id: `dispute-${this.disputes.length + 1}`,
          status: 'OPEN',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        this.disputes.push(dispute);
        return this.hydrateDispute(dispute);
      },
      findFirst: async ({ where }) => {
        const dispute = this.disputes.find((item) =>
          this.matchesDisputeWhere(item, where),
        );
        return dispute ? this.hydrateDispute(dispute) : null;
      },
      findUnique: async ({ where }) => {
        const dispute = this.disputes.find((item) => item.id === where.id);
        return dispute ? this.hydrateDispute(dispute) : null;
      },
      findMany: async ({ where = {} } = {}) =>
        this.disputes
          .filter((item) => this.matchesDisputeWhere(item, where))
          .map((item) => this.hydrateDispute(item)),
      update: async ({ where, data }) => {
        const dispute = this.disputes.find((item) => item.id === where.id);
        Object.assign(dispute, data, { updatedAt: new Date() });
        return this.hydrateDispute(dispute);
      },
      count: async ({ where = {} } = {}) =>
        this.disputes.filter((item) => this.matchesDisputeWhere(item, where))
          .length,
    };

    this.disputeEvidence = {
      create: async ({ data }) => {
        const evidence = {
          id: `dispute-evidence-${this.disputeEvidenceRows.length + 1}`,
          createdAt: new Date(),
          ...data,
        };
        this.disputeEvidenceRows.push(evidence);
        return evidence;
      },
    };

    this.bookingIncident = {
      create: async ({ data }) => {
        const incident = {
          id: `incident-${this.incidents.length + 1}`,
          status: 'OPEN',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        this.incidents.push(incident);
        return this.hydrateIncident(incident);
      },
      findFirst: async ({ where }) => {
        const incident = this.incidents.find((item) =>
          this.matchesIncidentWhere(item, where),
        );
        return incident ? this.hydrateIncident(incident) : null;
      },
      findUnique: async ({ where }) => {
        const incident = this.incidents.find((item) => item.id === where.id);
        return incident ? this.hydrateIncident(incident) : null;
      },
      findMany: async ({ where = {} } = {}) =>
        this.incidents
          .filter((item) => this.matchesIncidentWhere(item, where))
          .map((item) => this.hydrateIncident(item)),
      update: async ({ where, data }) => {
        const incident = this.incidents.find((item) => item.id === where.id);
        Object.assign(incident, data, { updatedAt: new Date() });
        return this.hydrateIncident(incident);
      },
      count: async ({ where = {} } = {}) =>
        this.incidents.filter((item) => this.matchesIncidentWhere(item, where))
          .length,
    };

    this.incidentEvidence = {
      create: async ({ data }) => {
        const evidence = {
          id: `incident-evidence-${this.incidentEvidenceRows.length + 1}`,
          createdAt: new Date(),
          ...data,
        };
        this.incidentEvidenceRows.push(evidence);
        return evidence;
      },
    };

    this.auditLog = {
      create: async ({ data }) => {
        const log = {
          id: `audit-${this.auditLogs.length + 1}`,
          createdAt: new Date(),
          ...data,
        };
        this.auditLogs.push(log);
        return log;
      },
      count: async () => this.auditLogs.length,
      findMany: async () => this.auditLogs,
    };

    this.user = {
      count: async () => this.users.length,
      findUnique: async ({ where }) =>
        this.users.find((user) => user.id === where.id) || null,
      findMany: async () => this.users,
      update: async ({ where, data }) => {
        const user = this.users.find((item) => item.id === where.id);
        Object.assign(user, data);
        return user;
      },
    };

    this.vendorVerification = {
      count: async () => this.verifications.length,
      findMany: async () => this.verifications,
      findUnique: async ({ where }) =>
        this.verifications.find((item) => item.id === where.id) || null,
      update: async ({ where, data }) => {
        const item = this.verifications.find((entry) => entry.id === where.id);
        Object.assign(item, data);
        return item;
      },
    };

    this.serviceCategory = {
      count: async () => this.categories.length,
      findMany: async () => this.categories,
    };

    this.serviceListing = {
      count: async () => this.listings.length,
      findMany: async () => this.listings,
      findUnique: async ({ where }) =>
        this.listings.find((item) => item.id === where.id) || null,
      update: async ({ where, data }) => {
        const item = this.listings.find((entry) => entry.id === where.id);
        Object.assign(item, data);
        return item;
      },
    };

    this.bookingPayment = {
      count: async () => this.payments.length,
      findMany: async () => this.payments,
    };

    this.activityEvent = {
      findMany: async () => this.activities,
    };
  }

  hydrateBooking(booking) {
    return {
      ...booking,
      vendor: this.vendors.find((vendor) => vendor.id === booking.vendorId),
      customer: this.users.find((user) => user.id === booking.customerId),
    };
  }

  hydrateReview(review) {
    return {
      ...review,
      vendor: this.vendors.find((vendor) => vendor.id === review.vendorId),
      booking: this.hydrateBooking(
        this.bookings.find((booking) => booking.id === review.bookingId),
      ),
      customer: this.users.find((user) => user.id === review.customerId),
    };
  }

  hydrateDispute(dispute) {
    return {
      ...dispute,
      booking: this.hydrateBooking(
        this.bookings.find((booking) => booking.id === dispute.bookingId),
      ),
      vendor: this.vendors.find((vendor) => vendor.id === dispute.vendorId),
      evidence: this.disputeEvidenceRows.filter(
        (item) => item.disputeId === dispute.id,
      ),
    };
  }

  hydrateIncident(incident) {
    return {
      ...incident,
      booking: this.hydrateBooking(
        this.bookings.find((booking) => booking.id === incident.bookingId),
      ),
      vendor: this.vendors.find((vendor) => vendor.id === incident.vendorId),
      evidence: this.incidentEvidenceRows.filter(
        (item) => item.incidentId === incident.id,
      ),
    };
  }

  matchesBookingWhere(booking, where = {}) {
    if (where.id && booking.id !== where.id) return false;
    if (where.customerId && booking.customerId !== where.customerId)
      return false;
    if (where.vendorId && booking.vendorId !== where.vendorId) return false;
    if (
      where.status &&
      typeof where.status === 'string' &&
      booking.status !== where.status
    )
      return false;
    if (where.status?.in && !where.status.in.includes(booking.status))
      return false;
    if (where.OR)
      return where.OR.some((condition) =>
        this.matchesBookingWhere(booking, condition),
      );
    if (where.vendor?.userId) {
      const vendor = this.vendors.find((item) => item.id === booking.vendorId);
      return vendor?.userId === where.vendor.userId;
    }
    return true;
  }

  matchesReviewWhere(review, where = {}) {
    if (where.id && review.id !== where.id) return false;
    if (where.customerId && review.customerId !== where.customerId)
      return false;
    if (where.vendorId && review.vendorId !== where.vendorId) return false;
    if (
      where.status &&
      typeof where.status === 'string' &&
      review.status !== where.status
    )
      return false;
    if (where.status?.in && !where.status.in.includes(review.status))
      return false;
    if (where.vendor?.userId) {
      const vendor = this.vendors.find((item) => item.id === review.vendorId);
      return vendor?.userId === where.vendor.userId;
    }
    return true;
  }

  matchesDisputeWhere(dispute, where = {}) {
    if (where.id && dispute.id !== where.id) return false;
    if (where.customerId && dispute.customerId !== where.customerId)
      return false;
    if (where.vendorId && dispute.vendorId !== where.vendorId) return false;
    if (
      where.status &&
      typeof where.status === 'string' &&
      dispute.status !== where.status
    )
      return false;
    if (where.status?.in && !where.status.in.includes(dispute.status))
      return false;
    if (where.OR)
      return where.OR.some((condition) =>
        this.matchesDisputeWhere(dispute, condition),
      );
    if (where.vendor?.userId) {
      const vendor = this.vendors.find((item) => item.id === dispute.vendorId);
      return vendor?.userId === where.vendor.userId;
    }
    return true;
  }

  matchesIncidentWhere(incident, where = {}) {
    if (where.id && incident.id !== where.id) return false;
    if (where.customerId && incident.customerId !== where.customerId)
      return false;
    if (where.vendorId && incident.vendorId !== where.vendorId) return false;
    if (
      where.status &&
      typeof where.status === 'string' &&
      incident.status !== where.status
    )
      return false;
    if (where.status?.in && !where.status.in.includes(incident.status))
      return false;
    if (where.OR)
      return where.OR.some((condition) =>
        this.matchesIncidentWhere(incident, condition),
      );
    if (where.vendor?.userId) {
      const vendor = this.vendors.find((item) => item.id === incident.vendorId);
      return vendor?.userId === where.vendor.userId;
    }
    return true;
  }
}

async function run() {
  const prisma = new TrustPrisma();
  const reviews = new ReviewsService(prisma);
  const admin = new AdminService(prisma);

  await assert.rejects(
    () =>
      reviews.submitReview('customer-1', 'booking-confirmed', { rating: 5 }),
    BadRequestException,
  );
  await assert.rejects(
    () =>
      reviews.submitReview('customer-2', 'booking-completed', { rating: 5 }),
    NotFoundException,
  );

  const review = await reviews.submitReview('customer-1', 'booking-completed', {
    rating: 5,
    comment: 'Great service',
    status: 'REMOVED',
  });
  assert.equal(review.status, 'PUBLISHED');
  assert.equal(prisma.trustSignals.length, 4);
  await assert.rejects(
    () =>
      reviews.submitReview('customer-1', 'booking-completed', { rating: 4 }),
    BadRequestException,
  );

  const response = await reviews.respondToReview(
    'vendor-user-1',
    review.id,
    'Thank you.',
  );
  assert.equal(response.vendorResponse, 'Thank you.');

  const moderatedReview = await admin.moderateReview('admin-1', review.id, {
    status: 'HIDDEN',
    visibility: 'PRIVATE_TO_VENDOR',
  });
  assert.equal(moderatedReview.status, 'HIDDEN');
  assert.ok(
    prisma.auditLogs.some((log) => log.action === 'ADMIN_REVIEW_MODERATION'),
  );
  assert.equal(
    prisma.trustSignals.find((signal) => signal.type === 'REVIEW_SCORE').score,
    0,
  );

  const incident = await reviews.createIncident(
    'customer-1',
    'booking-completed',
    {
      title: 'Vendor arrived late',
      description: 'Arrival was 40 minutes late.',
      severity: 'HIGH',
    },
  );
  assert.equal(incident.status, 'OPEN');
  const incidentEvidence = await reviews.uploadIncidentEvidence(
    'customer-1',
    incident.id,
    { fileUrl: 'https://example.test/evidence.jpg', note: 'Timestamped photo' },
  );
  assert.equal(incidentEvidence.fileUrl, 'https://example.test/evidence.jpg');
  const incidentResponse = await reviews.vendorIncidentResponse(
    'vendor-user-1',
    incident.id,
    { response: 'Traffic caused the delay.' },
  );
  assert.equal(incidentResponse.status, 'VENDOR_RESPONDED');
  const resolvedIncident = await reviews.resolveIncident(
    'customer-1',
    incident.id,
    {
      resolutionNote: 'Handled with vendor warning.',
    },
  );
  assert.equal(resolvedIncident.status, 'RESOLVED');

  const escalatedIncident = await reviews.createIncident(
    'customer-1',
    'booking-completed',
    { title: 'Payment disagreement' },
  );
  const disputeFromIncident = await reviews.escalateIncidentToDispute(
    'customer-1',
    escalatedIncident.id,
    { details: 'Escalate to support.' },
  );
  assert.equal(disputeFromIncident.status, 'OPEN');

  await assert.rejects(
    () =>
      reviews.openDispute('vendor-user-1', 'booking-completed', {
        reason: 'Vendor cannot open customer dispute',
      }),
    NotFoundException,
  );
  const dispute = await reviews.openDispute('customer-1', 'booking-completed', {
    reason: 'Missing deliverables',
    evidenceUrls: ['https://example.test/chat.png'],
  });
  assert.deepEqual(dispute.evidenceUrls, ['https://example.test/chat.png']);
  const evidence = await reviews.uploadDisputeEvidence(
    'customer-1',
    dispute.id,
    {
      fileUrl: 'https://example.test/contract.pdf',
    },
  );
  assert.equal(evidence.evidence.fileUrl, 'https://example.test/contract.pdf');
  const vendorReply = await reviews.vendorDisputeResponse(
    'vendor-user-1',
    dispute.id,
    { response: 'Files are being re-exported.' },
  );
  assert.equal(vendorReply.status, 'UNDER_REVIEW');

  const reviewed = await admin.moderateDispute('admin-1', dispute.id, {
    status: 'RESOLVED',
    supportNote: 'Support reviewed both timelines.',
    adminDecision: 'Partial refund recommended.',
    resolutionNote: 'Closed by admin.',
  });
  assert.equal(reviewed.adminDecision, 'Partial refund recommended.');
  assert.equal(reviewed.decidedById, 'admin-1');
  assert.ok(
    prisma.auditLogs.some((log) => log.action === 'ADMIN_DISPUTE_MODERATION'),
  );

  await assert.rejects(
    () =>
      admin.updateUserStatus('admin-1', 'admin-1', {
        isSuspended: true,
      }),
    BadRequestException,
  );
  const dashboard = await admin.dashboard();
  assert.equal(typeof dashboard.metrics.users, 'number');
  assert.ok(Array.isArray(await admin.listVendors({ q: 'Noor' })));
  assert.ok(Array.isArray(await admin.listIncidents({ status: 'RESOLVED' })));
  assert.ok(Array.isArray(await admin.listPayments({ status: 'OVERDUE' })));
  assert.ok(
    (await admin.savedViews()).some((view) => view.id === 'open-disputes'),
  );
  assert.equal((await admin.reports()).vendors, 1);

  console.log('Trust, safety, and admin tests passed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
