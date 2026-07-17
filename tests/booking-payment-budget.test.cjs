require('ts-node/register/transpile-only');

const assert = require('node:assert/strict');
const { BadRequestException } = require('@nestjs/common');
const {
  BookingsService,
} = require('../apps/api/src/bookings/bookings.service');
const {
  ProposalsService,
} = require('../apps/api/src/proposals/proposals.service');

class BookingPrisma {
  constructor() {
    this.users = [
      { id: 'customer-1', email: 'customer@test.local' },
      { id: 'vendor-user-1', email: 'vendor@test.local' },
    ];
    this.categories = [{ id: 'cat-photo', name: 'Photography' }];
    this.weddings = [
      {
        id: 'wedding-1',
        ownerId: 'customer-1',
        estimatedBudget: 250000,
      },
    ];
    this.events = [
      {
        id: 'event-1',
        weddingId: 'wedding-1',
        name: 'Baraat',
        date: new Date('2026-12-10'),
      },
    ];
    this.vendors = [
      {
        id: 'vendor-1',
        userId: 'vendor-user-1',
        businessName: 'Noor Photo Studio',
      },
    ];
    this.requests = [
      {
        id: 'request-1',
        customerId: 'customer-1',
        weddingId: 'wedding-1',
        eventId: 'event-1',
        categoryId: 'cat-photo',
        title: 'Baraat photography',
        eventDate: new Date('2026-12-10'),
        category: this.categories[0],
        wedding: this.weddings[0],
        event: this.events[0],
      },
      {
        id: 'request-existing',
        customerId: 'customer-1',
        weddingId: 'wedding-1',
        eventId: 'event-1',
        categoryId: 'cat-photo',
        title: 'Existing photography',
        eventDate: new Date('2026-12-09'),
        category: this.categories[0],
        wedding: this.weddings[0],
        event: this.events[0],
      },
    ];
    this.proposals = [
      {
        id: 'proposal-1',
        serviceRequestId: 'request-1',
        vendorId: 'vendor-1',
        status: 'ACCEPTED',
        acceptedAt: new Date('2026-07-15'),
      },
    ];
    this.versions = [
      {
        id: 'version-1',
        proposalId: 'proposal-1',
        versionNumber: 1,
        totalPrice: 200000,
        currency: 'PKR',
        packageDescription: 'Photo and video team',
        inclusions: ['Lead photographer', 'Highlights film'],
        exclusions: ['Drone permit'],
        addOns: ['Same-day edit'],
        teamSize: 3,
        advanceAmount: 50000,
        paymentSchedule: '50,000 advance, balance before event',
        cancellationPolicy: 'Refundable until 10 days before event',
        validityDate: new Date('2026-08-01'),
      },
    ];
    this.bookings = [
      {
        id: 'booking-existing',
        proposalId: 'proposal-existing',
        serviceRequestId: 'request-existing',
        weddingId: 'wedding-1',
        eventId: 'event-1',
        customerId: 'customer-1',
        vendorId: 'vendor-1',
        title: 'Existing photo booking',
        status: 'CONFIRMED',
        totalAmount: 100000,
        currency: 'PKR',
        budgetWarnings: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    this.bookingEvents = [];
    this.payments = [];
    this.budgetItems = [];
    this.availability = [
      {
        id: 'availability-1',
        vendorId: 'vendor-1',
        date: new Date('2026-12-10'),
        status: 'AVAILABLE',
        capacity: 3,
      },
    ];
    this.notifications = [];
    this.activities = [];

    this.$transaction = async (callback) => callback(this);

    this.proposal = {
      findUnique: async ({ where }) => {
        const proposal = this.proposals.find((item) => item.id === where.id);
        return proposal ? this.hydrateProposal(proposal) : null;
      },
      findFirst: async ({ where }) => {
        const proposal = this.proposals.find((item) =>
          this.matchesProposalWhere(item, where),
        );
        return proposal ? this.hydrateProposal(proposal) : null;
      },
    };

    this.booking = {
      create: async ({ data }) => {
        const booking = {
          id: `booking-${this.bookings.length + 1}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        this.bookings.push(booking);
        return booking;
      },
      findUnique: async ({ where }) => {
        const booking = this.bookings.find((item) =>
          where.id
            ? item.id === where.id
            : item.proposalId === where.proposalId,
        );
        return booking ? this.hydrateBooking(booking) : null;
      },
      findFirst: async ({ where }) => {
        const booking = this.bookings.find((item) =>
          this.matchesBookingWhere(item, where),
        );
        return booking ? this.hydrateBooking(booking) : null;
      },
      findMany: async ({ where = {} } = {}) =>
        this.bookings
          .filter((booking) => this.matchesBookingWhere(booking, where))
          .map((booking) => this.hydrateBooking(booking)),
      update: async ({ where, data }) => {
        const booking = this.bookings.find((item) => item.id === where.id);
        Object.assign(booking, data, { updatedAt: new Date() });
        return this.hydrateBooking(booking);
      },
    };

    this.bookingEvent = {
      create: async ({ data }) => {
        const item = {
          id: `booking-event-${this.bookingEvents.length + 1}`,
          createdAt: new Date(),
          ...data,
        };
        this.bookingEvents.push(item);
        return item;
      },
    };

    this.bookingPayment = {
      create: async ({ data }) => {
        const payment = {
          id: `payment-${this.payments.length + 1}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        this.payments.push(payment);
        return payment;
      },
      findFirst: async ({ where }) => {
        const payment = this.payments.find(
          (item) => item.id === where.id && item.bookingId === where.bookingId,
        );
        return payment
          ? {
              ...payment,
              booking: this.bookings.find((b) => b.id === payment.bookingId),
            }
          : null;
      },
      findMany: async ({ where }) =>
        this.payments.filter((payment) => {
          if (where.bookingId && payment.bookingId !== where.bookingId)
            return false;
          if (where.status?.in && !where.status.in.includes(payment.status)) {
            return false;
          }
          if (where.dueDate?.lt) {
            return payment.dueDate && payment.dueDate < where.dueDate.lt;
          }
          return true;
        }),
      update: async ({ where, data }) => {
        const payment = this.payments.find((item) => item.id === where.id);
        Object.assign(payment, data, { updatedAt: new Date() });
        return payment;
      },
    };

    this.budgetItem = {
      create: async ({ data }) => {
        const item = {
          id: `budget-${this.budgetItems.length + 1}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        this.budgetItems.push(item);
        return item;
      },
      update: async ({ where, data }) => {
        const item = this.budgetItems.find((entry) => entry.id === where.id);
        Object.assign(item, data, { updatedAt: new Date() });
        return item;
      },
    };

    this.vendorAvailability = {
      findFirst: async ({ where }) =>
        this.availability.find(
          (slot) =>
            slot.vendorId === where.vendorId &&
            slot.date.getTime() === where.date.getTime() &&
            where.status.in.includes(slot.status),
        ) || null,
      update: async ({ where, data }) => {
        const slot = this.availability.find((item) => item.id === where.id);
        Object.assign(slot, data);
        return slot;
      },
      create: async ({ data }) => {
        const slot = {
          id: `availability-${this.availability.length + 1}`,
          ...data,
        };
        this.availability.push(slot);
        return slot;
      },
      updateMany: async ({ where, data }) => {
        let count = 0;
        for (const slot of this.availability) {
          if (
            slot.vendorId === where.vendorId &&
            slot.date.getTime() === where.date.getTime() &&
            slot.status === where.status
          ) {
            Object.assign(slot, data);
            count += 1;
          }
        }
        return { count };
      },
    };

    this.vendor = {
      findUnique: async ({ where }) =>
        this.vendors.find((vendor) => vendor.userId === where.userId) || null,
    };

    this.wedding = {
      findFirst: async ({ where }) =>
        this.weddings.find(
          (wedding) =>
            wedding.id === where.id && wedding.ownerId === where.ownerId,
        ) || null,
    };
  }

  hydrateProposal(proposal) {
    return {
      ...proposal,
      vendor: this.vendors.find((vendor) => vendor.id === proposal.vendorId),
      serviceRequest: this.hydrateRequest(
        this.requests.find(
          (request) => request.id === proposal.serviceRequestId,
        ),
      ),
      versions: this.versions
        .filter((version) => version.proposalId === proposal.id)
        .sort((a, b) => b.versionNumber - a.versionNumber),
    };
  }

  hydrateRequest(request) {
    return {
      ...request,
      category: this.categories.find(
        (category) => category.id === request.categoryId,
      ),
      wedding: this.weddings.find(
        (wedding) => wedding.id === request.weddingId,
      ),
      event: this.events.find((event) => event.id === request.eventId),
    };
  }

  hydrateBooking(booking) {
    const request = this.hydrateRequest(
      this.requests.find((item) => item.id === booking.serviceRequestId),
    );
    return {
      ...booking,
      customer: this.users.find((user) => user.id === booking.customerId),
      vendor: this.vendors.find((vendor) => vendor.id === booking.vendorId),
      proposal: this.hydrateProposal(
        this.proposals.find((proposal) => proposal.id === booking.proposalId) ||
          this.proposals[0],
      ),
      acceptedProposalVersion: this.versions.find(
        (version) => version.id === booking.acceptedProposalVersionId,
      ),
      serviceRequest: request,
      wedding: this.weddings.find(
        (wedding) => wedding.id === booking.weddingId,
      ),
      event: this.events.find((event) => event.id === booking.eventId),
      events: this.bookingEvents
        .filter((item) => item.bookingId === booking.id)
        .map((item) => ({
          ...item,
          event: this.events.find((event) => event.id === item.eventId),
        })),
      payments: this.payments
        .filter((payment) => payment.bookingId === booking.id)
        .sort((a, b) => {
          const left = a.dueDate ? a.dueDate.getTime() : 0;
          const right = b.dueDate ? b.dueDate.getTime() : 0;
          return left - right;
        }),
    };
  }

  matchesProposalWhere(proposal, where = {}) {
    if (where.id && proposal.id !== where.id) return false;
    if (where.vendor?.userId) {
      const vendor = this.vendors.find((item) => item.id === proposal.vendorId);
      if (vendor?.userId !== where.vendor.userId) return false;
    }
    return true;
  }

  matchesBookingWhere(booking, where = {}) {
    if (where.id && booking.id !== where.id) return false;
    if (where.proposalId && booking.proposalId !== where.proposalId)
      return false;
    if (where.weddingId && booking.weddingId !== where.weddingId) return false;
    if (where.customerId && booking.customerId !== where.customerId)
      return false;
    if (where.vendorId && booking.vendorId !== where.vendorId) return false;
    if (where.id?.not && booking.id === where.id.not) return false;
    if (where.status?.not && booking.status === where.status.not) return false;
    if (where.vendor?.userId) {
      const vendor = this.vendors.find((item) => item.id === booking.vendorId);
      if (vendor?.userId !== where.vendor.userId) return false;
    }
    if (where.OR) {
      return where.OR.some((condition) =>
        this.matchesBookingWhere(booking, condition),
      );
    }
    return true;
  }
}

async function run() {
  const prisma = new BookingPrisma();
  const notifications = {
    createNotification: async (dto) => {
      prisma.notifications.push(dto);
      return dto;
    },
    createActivity: async (dto) => {
      prisma.activities.push(dto);
      return dto;
    },
  };
  const bookingsService = new BookingsService(prisma, notifications);
  const proposalsService = new ProposalsService(prisma, bookingsService);

  const booking =
    await bookingsService.createFromAcceptedProposal('proposal-1');
  assert.equal(booking.proposalId, 'proposal-1');
  assert.equal(booking.acceptedProposalVersionId, 'version-1');
  assert.equal(booking.weddingId, 'wedding-1');
  assert.equal(booking.events.length, 1);
  assert.equal(booking.status, 'PENDING_AGREEMENT');
  assert.equal(booking.payments.length, 2);
  assert.equal(booking.financialSummary.totalAmount, 200000);
  assert.equal(booking.financialSummary.outstandingAmount, 200000);
  assert.ok(booking.agreementText.includes('"gatewayPolicy"'));
  assert.equal(
    prisma.availability.find((slot) => slot.id === 'availability-1').status,
    'TENTATIVELY_RESERVED',
  );

  assert.equal(
    prisma.budgetItems.reduce((sum, item) => sum + Number(item.amount), 0),
    200000,
  );
  assert.ok(
    booking.warnings.some((warning) => warning.includes('Over-budget warning')),
  );
  assert.ok(
    booking.warnings.some((warning) =>
      warning.includes('Duplicate category booking'),
    ),
  );

  await assert.rejects(
    () =>
      proposalsService.reviseProposal('vendor-user-1', 'proposal-1', {
        submit: true,
        totalPrice: 210000,
      }),
    BadRequestException,
  );

  await assert.rejects(
    () =>
      bookingsService.setBookingStatus('customer-1', booking.id, 'COMPLETED'),
    BadRequestException,
  );

  const confirmed = await bookingsService.confirmVendor(
    'vendor-user-1',
    booking.id,
  );
  assert.equal(confirmed.status, 'CONFIRMED');
  assert.ok(confirmed.agreedAt);

  const started = await bookingsService.setBookingStatus(
    'customer-1',
    booking.id,
    'IN_PROGRESS',
  );
  assert.equal(started.status, 'IN_PROGRESS');
  const completed = await bookingsService.setBookingStatus(
    'vendor-user-1',
    booking.id,
    'COMPLETED',
  );
  assert.equal(completed.status, 'COMPLETED');

  const advance = completed.payments.find(
    (payment) => payment.title === 'Advance payment',
  );
  const recorded = await bookingsService.recordPayment(
    'customer-1',
    booking.id,
    advance.id,
    {
      method: 'EASYPAISA',
      reference: 'EP-123',
      receiptUrl: 'https://example.test/receipt.jpg',
      notes: 'Paid manually.',
    },
  );
  const recordedAdvance = recorded.payments.find(
    (payment) => payment.id === advance.id,
  );
  assert.equal(recordedAdvance.status, 'DUE');
  assert.equal(recordedAdvance.receiptUrl, 'https://example.test/receipt.jpg');
  assert.equal(recorded.financialSummary.paidAmount, 0);
  assert.equal(recorded.financialSummary.pendingVerificationAmount, 50000);

  const verified = await bookingsService.verifyPayment(
    'vendor-user-1',
    booking.id,
    advance.id,
    { note: 'Receipt checked.' },
  );
  const verifiedAdvance = verified.payments.find(
    (payment) => payment.id === advance.id,
  );
  assert.equal(verifiedAdvance.status, 'PAID');
  assert.equal(verifiedAdvance.verifiedById, 'vendor-user-1');
  assert.equal(verified.financialSummary.paidAmount, 50000);
  assert.equal(verified.financialSummary.outstandingAmount, 150000);
  assert.equal(
    prisma.budgetItems.find((item) => item.id === verifiedAdvance.budgetItemId)
      .isPaid,
    true,
  );

  const finalPayment = verified.payments.find(
    (payment) => payment.title === 'Final payment',
  );
  await bookingsService.updatePayment(
    'customer-1',
    booking.id,
    finalPayment.id,
    {
      dueDate: '2026-01-01',
      status: 'DUE',
    },
  );
  const overdue = await bookingsService.getBooking('customer-1', booking.id);
  assert.equal(
    overdue.payments.find((payment) => payment.id === finalPayment.id).status,
    'OVERDUE',
  );
  assert.ok(
    prisma.notifications.some(
      (notification) => notification.title === 'Payment milestone overdue',
    ),
  );

  await assert.rejects(
    () =>
      bookingsService.recordPayment('customer-1', booking.id, finalPayment.id, {
        method: 'CARD',
      }),
    BadRequestException,
  );

  console.log('Booking, payment, and budget tests passed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
