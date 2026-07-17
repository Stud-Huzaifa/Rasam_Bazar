require('ts-node/register/transpile-only');

const assert = require('node:assert/strict');
const { NotFoundException, BadRequestException } = require('@nestjs/common');
const { GuestsService } = require('../apps/api/src/guests/guests.service');
const {
  NotificationsService,
} = require('../apps/api/src/notifications/notifications.service');
const {
  BookingsService,
} = require('../apps/api/src/bookings/bookings.service');

class CollaborationPrisma {
  constructor() {
    this.users = [
      { id: 'customer-1', email: 'customer@test.local', fullName: 'Customer' },
      { id: 'vendor-user-1', email: 'vendor@test.local', fullName: 'Vendor' },
      { id: 'stranger', email: 'stranger@test.local', fullName: 'Stranger' },
    ];
    this.vendors = [
      { id: 'vendor-1', userId: 'vendor-user-1', businessName: 'Noor Studio' },
    ];
    this.weddings = [
      {
        id: 'wedding-1',
        ownerId: 'customer-1',
        mainCoordinator: 'Ayesha',
        members: [],
      },
    ];
    this.events = [{ id: 'event-1', weddingId: 'wedding-1', name: 'Baraat' }];
    this.guests = [];
    this.invitations = [];
    this.requests = [
      {
        id: 'request-1',
        title: 'Photo request',
        customerId: 'customer-1',
        weddingId: 'wedding-1',
      },
    ];
    this.proposals = [
      {
        id: 'proposal-1',
        serviceRequestId: 'request-1',
        vendorId: 'vendor-1',
      },
    ];
    this.bookings = [
      {
        id: 'booking-1',
        proposalId: 'proposal-1',
        serviceRequestId: 'request-1',
        weddingId: 'wedding-1',
        eventId: 'event-1',
        customerId: 'customer-1',
        vendorId: 'vendor-1',
        title: 'Noor Studio - Baraat',
        status: 'CONFIRMED',
        totalAmount: 100000,
        budgetWarnings: [],
        payments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    this.disputes = [
      {
        id: 'dispute-1',
        bookingId: 'booking-1',
        vendorId: 'vendor-1',
        customerId: 'customer-1',
        reason: 'Late arrival',
      },
    ];
    this.threads = [];
    this.messages = [];
    this.notifications = [];
    this.activities = [];
    this.operationStatuses = [];

    this.wedding = {
      findFirst: async ({ where }) =>
        this.weddings.find(
          (wedding) =>
            wedding.id === where.id &&
            (wedding.ownerId === where.ownerId ||
              where.OR?.some(
                (condition) =>
                  condition.ownerId === wedding.ownerId ||
                  condition.members?.some?.userId === 'member-1',
              )),
        ) || null,
    };

    this.weddingEvent = {
      findFirst: async ({ where }) =>
        this.events.find(
          (event) =>
            event.id === where.id && event.weddingId === where.weddingId,
        ) || null,
    };

    this.guest = {
      create: async ({ data }) => {
        const guest = {
          id: `guest-${this.guests.length + 1}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          side: 'SHARED',
          adults: 1,
          children: 0,
          additionalEstimate: 0,
          ...data,
        };
        this.guests.push(guest);
        return guest;
      },
      findMany: async ({ where }) =>
        this.guests
          .filter((guest) => guest.weddingId === where.weddingId)
          .map((guest) => this.hydrateGuest(guest)),
      findFirst: async ({ where }) =>
        this.guests.find(
          (guest) =>
            guest.id === where.id && guest.weddingId === where.weddingId,
        ) || null,
      findUnique: async ({ where }) => {
        const guest = this.guests.find((item) => item.id === where.id);
        return guest ? this.hydrateGuest(guest) : null;
      },
      update: async ({ where, data }) => {
        const guest = this.guests.find((item) => item.id === where.id);
        Object.assign(guest, data);
        return this.hydrateGuest(guest);
      },
      delete: async ({ where }) => {
        this.guests = this.guests.filter((guest) => guest.id !== where.id);
      },
    };

    this.guestEventInvitation = {
      upsert: async ({ where, create, update }) => {
        const key = where.guestId_eventId;
        let invitation = this.invitations.find(
          (item) =>
            item.guestId === key.guestId && item.eventId === key.eventId,
        );
        if (!invitation) {
          invitation = {
            id: `invitation-${this.invitations.length + 1}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...create,
          };
          this.invitations.push(invitation);
        } else {
          Object.assign(invitation, update, { updatedAt: new Date() });
        }
        return {
          ...invitation,
          guest: this.guests.find((guest) => guest.id === invitation.guestId),
          event: this.events.find((event) => event.id === invitation.eventId),
        };
      },
    };

    this.user = {
      findUnique: async ({ where }) =>
        this.users.find((user) => user.id === where.id) || null,
    };

    this.notification = {
      create: async ({ data }) => {
        const notification = {
          id: `notification-${this.notifications.length + 1}`,
          readAt: null,
          createdAt: new Date(),
          ...data,
        };
        this.notifications.push(notification);
        return notification;
      },
      findMany: async ({ where }) =>
        this.notifications.filter(
          (item) => item.recipientId === where.recipientId,
        ),
      count: async ({ where }) =>
        this.notifications.filter(
          (item) =>
            item.recipientId === where.recipientId &&
            (where.readAt !== null || item.readAt === null),
        ).length,
      findFirst: async ({ where }) =>
        this.notifications.find(
          (item) =>
            item.id === where.id && item.recipientId === where.recipientId,
        ) || null,
      update: async ({ where, data }) => {
        const item = this.notifications.find((entry) => entry.id === where.id);
        Object.assign(item, data);
        return item;
      },
      updateMany: async ({ where, data }) => {
        for (const item of this.notifications) {
          if (
            item.recipientId === where.recipientId &&
            item.readAt === where.readAt
          ) {
            Object.assign(item, data);
          }
        }
      },
    };

    this.messageThread = {
      create: async ({ data }) => {
        const thread = {
          id: `thread-${this.threads.length + 1}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        this.threads.push(thread);
        return thread;
      },
      findFirst: async ({ where }) =>
        this.threads.find((thread) => this.matchesThreadWhere(thread, where)) ||
        null,
      findUnique: async ({ where }) => {
        const thread = this.threads.find((item) => item.id === where.id);
        return thread ? this.hydrateThread(thread) : null;
      },
      findMany: async ({ where }) =>
        this.threads
          .filter((thread) => this.matchesThreadWhere(thread, where))
          .map((thread) => this.hydrateThread(thread)),
      update: async ({ where, data }) => {
        const thread = this.threads.find((item) => item.id === where.id);
        Object.assign(thread, data);
        return thread;
      },
    };

    this.message = {
      create: async ({ data }) => {
        const message = {
          id: `message-${this.messages.length + 1}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          attachments: [],
          ...data,
        };
        this.messages.push(message);
        return message;
      },
      findMany: async ({ where }) =>
        this.messages.filter((message) => message.threadId === where.threadId),
      updateMany: async ({ where, data }) => {
        for (const message of this.messages) {
          if (
            message.threadId === where.threadId &&
            message.senderId !== where.senderId.not
          ) {
            Object.assign(message, data);
          }
        }
      },
      count: async ({ where }) =>
        this.messages.filter((message) => {
          if (message.threadId !== where.threadId) return false;
          if (message.senderId === where.senderId.not) return false;
          if (where.customerReadAt === null && message.customerReadAt)
            return false;
          if (where.vendorReadAt === null && message.vendorReadAt) return false;
          return true;
        }).length,
    };

    this.proposal = {
      findFirst: async ({ where }) => {
        const proposal = this.proposals.find((item) => item.id === where.id);
        if (!proposal) return null;
        const vendor = this.vendors.find(
          (item) => item.id === proposal.vendorId,
        );
        const request = this.requests.find(
          (item) => item.id === proposal.serviceRequestId,
        );
        const allowed =
          request.customerId === 'customer-1' ||
          vendor.userId === 'vendor-user-1';
        if (!allowed) return null;
        return { ...proposal, vendor, serviceRequest: request };
      },
    };

    this.serviceRequest = {
      findFirst: async ({ where }) => {
        const request = this.requests.find((item) => item.id === where.id);
        return request
          ? { ...request, proposals: this.proposals, invitations: [] }
          : null;
      },
    };

    this.bookingDispute = {
      findFirst: async ({ where }) => {
        const dispute = this.disputes.find((item) => item.id === where.id);
        return dispute
          ? {
              ...dispute,
              booking: this.bookings.find(
                (booking) => booking.id === dispute.bookingId,
              ),
              vendor: this.vendors.find(
                (vendor) => vendor.id === dispute.vendorId,
              ),
            }
          : null;
      },
    };

    this.booking = {
      findFirst: async ({ where }) => {
        const booking = this.bookings.find((item) =>
          this.matchesBookingWhere(item, where),
        );
        return booking ? this.hydrateBooking(booking) : null;
      },
      findMany: async ({ where }) =>
        this.bookings
          .filter((booking) => this.matchesBookingWhere(booking, where))
          .map((booking) => this.hydrateBooking(booking)),
      findUnique: async ({ where }) => {
        const booking = this.bookings.find((item) => item.id === where.id);
        return booking ? this.hydrateBooking(booking) : null;
      },
    };

    this.bookingOperationStatus = {
      create: async ({ data }) => {
        const status = {
          id: `operation-${this.operationStatuses.length + 1}`,
          occurredAt: new Date(),
          ...data,
        };
        this.operationStatuses.push(status);
        return status;
      },
    };

    this.activityEvent = {
      create: async ({ data }) => {
        const activity = {
          id: `activity-${this.activities.length + 1}`,
          ...data,
        };
        this.activities.push(activity);
        return activity;
      },
      findMany: async () => this.activities,
    };
  }

  hydrateGuest(guest) {
    return {
      ...guest,
      eventInvitations: this.invitations
        .filter((invitation) => invitation.guestId === guest.id)
        .map((invitation) => ({
          ...invitation,
          event: this.events.find((event) => event.id === invitation.eventId),
        })),
    };
  }

  hydrateThread(thread) {
    return {
      ...thread,
      customer: this.users.find((user) => user.id === thread.customerId),
      vendor: this.vendors.find((vendor) => vendor.id === thread.vendorId),
      booking: this.bookings.find((booking) => booking.id === thread.bookingId),
      proposal: this.proposals.find(
        (proposal) => proposal.id === thread.proposalId,
      ),
      dispute: this.disputes.find((dispute) => dispute.id === thread.disputeId),
      messages: this.messages.filter(
        (message) => message.threadId === thread.id,
      ),
    };
  }

  hydrateBooking(booking) {
    const vendor = this.vendors.find((item) => item.id === booking.vendorId);
    return {
      ...booking,
      vendor,
      customer: this.users.find((item) => item.id === booking.customerId),
      serviceRequest: this.requests.find(
        (item) => item.id === booking.serviceRequestId,
      ),
      wedding: this.weddings.find((item) => item.id === booking.weddingId),
      event: this.events.find((item) => item.id === booking.eventId),
      payments: [],
      events: [],
      operationStatuses: this.operationStatuses
        .filter((status) => status.bookingId === booking.id)
        .sort((a, b) => b.occurredAt - a.occurredAt),
    };
  }

  matchesThreadWhere(thread, where = {}) {
    if (where.id && thread.id !== where.id) return false;
    if (where.customerId && thread.customerId !== where.customerId)
      return false;
    if (where.vendor?.userId) {
      const vendor = this.vendors.find((item) => item.id === thread.vendorId);
      if (vendor?.userId !== where.vendor.userId) return false;
    }
    if (where.bookingId && thread.bookingId !== where.bookingId) return false;
    if (where.proposalId && thread.proposalId !== where.proposalId)
      return false;
    if (where.disputeId && thread.disputeId !== where.disputeId) return false;
    if (
      where.serviceRequestId &&
      thread.serviceRequestId !== where.serviceRequestId
    ) {
      return false;
    }
    if (where.OR)
      return where.OR.some((condition) =>
        this.matchesThreadWhere(thread, condition),
      );
    return true;
  }

  matchesBookingWhere(booking, where = {}) {
    if (where.id && booking.id !== where.id) return false;
    if (where.weddingId && booking.weddingId !== where.weddingId) return false;
    if (where.status?.not && booking.status === where.status.not) return false;
    if (where.customerId && booking.customerId !== where.customerId)
      return false;
    if (where.vendor?.userId) {
      const vendor = this.vendors.find((item) => item.id === booking.vendorId);
      if (vendor?.userId !== where.vendor.userId) return false;
    }
    if (where.OR)
      return where.OR.some((condition) =>
        this.matchesBookingWhere(booking, condition),
      );
    return true;
  }
}

async function run() {
  const prisma = new CollaborationPrisma();
  const guestsService = new GuestsService(prisma);
  const notificationsService = new NotificationsService(prisma);
  const bookingsService = new BookingsService(prisma, notificationsService);

  const brideGuest = await guestsService.addGuest('customer-1', 'wedding-1', {
    name: 'Bride Family',
    side: 'BRIDE',
    groupName: 'Bride cousins',
    adults: 4,
    children: 2,
    additionalEstimate: 1,
    eventIds: ['event-1'],
  });
  const groomGuest = await guestsService.addGuest('customer-1', 'wedding-1', {
    name: 'Groom Family',
    side: 'GROOM',
    groupName: 'Groom friends',
    adults: 3,
    children: 1,
    eventIds: ['event-1'],
  });

  await guestsService.updateRsvp(
    'customer-1',
    'wedding-1',
    brideGuest.id,
    'event-1',
    { rsvpStatus: 'ACCEPTED' },
  );
  await guestsService.updateRsvp(
    'customer-1',
    'wedding-1',
    groomGuest.id,
    'event-1',
    { rsvpStatus: 'ACCEPTED' },
  );

  const summary = await guestsService.guestSummary(
    'customer-1',
    'wedding-1',
    'event-1',
  );
  assert.equal(summary.totalCounts.adults, 7);
  assert.equal(summary.totalCounts.children, 3);
  assert.equal(summary.totalCounts.additionalEstimate, 1);
  assert.equal(summary.bySide.BRIDE.adults, 4);
  assert.equal(summary.rsvp.ACCEPTED, 2);

  const estimate = await guestsService.cateringEstimate(
    'customer-1',
    'wedding-1',
    {
      eventId: 'event-1',
      adultRate: 2000,
      childRate: 1000,
      childPortion: 0.5,
      bufferPercent: 10,
    },
  );
  assert.equal(estimate.expectedPeople, 11);
  assert.equal(estimate.basePortions, 9.5);
  assert.equal(estimate.recommendedPortions, 11);
  assert.equal(estimate.costEstimate, 19000);

  const shortage = await guestsService.cateringEstimate(
    'customer-1',
    'wedding-1',
    {
      eventId: 'event-1',
      plannedPlates: 8,
    },
  );
  assert.ok(shortage.warnings.some((warning) => warning.includes('Shortage')));

  const waste = await guestsService.cateringEstimate(
    'customer-1',
    'wedding-1',
    {
      eventId: 'event-1',
      plannedPlates: 30,
    },
  );
  assert.ok(waste.warnings.some((warning) => warning.includes('Waste')));

  const notification = await notificationsService.sendWorkflowNotification({
    recipientId: 'vendor-user-1',
    type: 'PROPOSAL_UPDATE',
    title: 'Proposal updated',
    body: 'Customer requested a revision.',
    entityType: 'Proposal',
    entityId: 'proposal-1',
  });
  assert.equal(notification.emailFallback, true);
  assert.equal(notification.emailStatus, 'DEV_FALLBACK');

  const proposalThread = await notificationsService.createThread('customer-1', {
    proposalId: 'proposal-1',
  });
  assert.equal(proposalThread.proposalId, 'proposal-1');
  assert.ok(proposalThread.messages.some((message) => message.isSystem));

  const message = await notificationsService.sendMessage(
    'customer-1',
    proposalThread.id,
    {
      body: 'Please confirm arrival time.',
      attachments: ['https://example.test/timeline.pdf'],
    },
  );
  assert.deepEqual(message.attachments, ['https://example.test/timeline.pdf']);
  await assert.rejects(
    () =>
      notificationsService.sendMessage('stranger', proposalThread.id, {
        body: 'Nope',
      }),
    NotFoundException,
  );

  await notificationsService.markThreadRead('vendor-user-1', proposalThread.id);
  assert.equal(
    prisma.messages.filter(
      (item) => item.threadId === proposalThread.id && item.vendorReadAt,
    ).length > 0,
    true,
  );

  const disputeThread = await notificationsService.createThread(
    'vendor-user-1',
    {
      disputeId: 'dispute-1',
    },
  );
  assert.equal(disputeThread.type, 'DISPUTE');

  const onTheWay = await bookingsService.updateOperationStatus(
    'vendor-user-1',
    'booking-1',
    {
      status: 'ON_THE_WAY',
      note: 'Leaving studio.',
      occurredAt: '2026-12-10T10:00:00.000Z',
    },
  );
  assert.equal(onTheWay.booking.currentOperationStatus, 'ON_THE_WAY');
  await bookingsService.updateOperationStatus('vendor-user-1', 'booking-1', {
    status: 'ARRIVED',
    occurredAt: '2026-12-10T10:30:00.000Z',
  });
  await bookingsService.updateOperationStatus('vendor-user-1', 'booking-1', {
    status: 'SETTING_UP',
    occurredAt: '2026-12-10T11:00:00.000Z',
  });
  await bookingsService.updateOperationStatus('vendor-user-1', 'booking-1', {
    status: 'READY',
    occurredAt: '2026-12-10T11:30:00.000Z',
  });
  await bookingsService.updateOperationStatus('vendor-user-1', 'booking-1', {
    status: 'ACTIVE_SERVICE',
    occurredAt: '2026-12-10T12:00:00.000Z',
  });
  await bookingsService.updateOperationStatus('vendor-user-1', 'booking-1', {
    status: 'COMPLETED',
    occurredAt: '2026-12-10T16:00:00.000Z',
  });
  await assert.rejects(
    () =>
      bookingsService.updateOperationStatus('vendor-user-1', 'booking-1', {
        status: 'DELAYED',
      }),
    BadRequestException,
  );

  const coordinator = await bookingsService.listWeddingDayOperations(
    'customer-1',
    'wedding-1',
  );
  assert.equal(coordinator.coordinator, 'Ayesha');
  assert.equal(coordinator.bookings[0].currentOperationStatus, 'COMPLETED');

  console.log('Collaboration and wedding-day operation tests passed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
