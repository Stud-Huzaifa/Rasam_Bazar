import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma.service';

type BookingTransition = 'IN_PROGRESS' | 'COMPLETED';
type VendorOperationStatus =
  | 'SCHEDULED'
  | 'ON_THE_WAY'
  | 'ARRIVED'
  | 'SETTING_UP'
  | 'READY'
  | 'ACTIVE_SERVICE'
  | 'COMPLETED'
  | 'DELAYED';
type SupportedPaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'EASYPAISA'
  | 'JAZZCASH'
  | 'SIMULATED_CARD'
  | 'OTHER';

const PAYMENT_METHODS: SupportedPaymentMethod[] = [
  'CASH',
  'BANK_TRANSFER',
  'EASYPAISA',
  'JAZZCASH',
  'SIMULATED_CARD',
  'OTHER',
];

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async createFromProposalForCustomer(userId: string, proposalId: string) {
    const proposal = await this.prisma.proposal.findFirst({
      where: { id: proposalId, serviceRequest: { customerId: userId } },
    });
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    return this.createFromAcceptedProposal(proposalId);
  }

  async createFromAcceptedProposal(proposalId: string) {
    const existing = await this.prisma.booking.findUnique({
      where: { proposalId },
      include: this.bookingInclude(),
    });
    if (existing) {
      return this.enrichBooking(existing);
    }

    const proposal = await this.prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        vendor: true,
        serviceRequest: {
          include: { category: true, wedding: true, event: true },
        },
        versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
      },
    });
    if (!proposal || proposal.status !== 'ACCEPTED') {
      throw new BadRequestException(
        'Only accepted proposals can become bookings',
      );
    }

    const acceptedVersion = proposal.versions[0];
    if (!acceptedVersion) {
      throw new BadRequestException('Accepted proposal has no version');
    }

    const totalAmount = Number(acceptedVersion.totalPrice || 0);
    if (!totalAmount || totalAmount <= 0) {
      throw new BadRequestException('Accepted proposal has no payable amount');
    }

    const request = proposal.serviceRequest;
    const eventDate = request.eventDate || request.event?.date || undefined;
    const eventIds = this.uniqueIds([request.eventId]);
    const milestones = this.defaultMilestones(
      totalAmount,
      Number(acceptedVersion.advanceAmount || 0),
      eventDate,
    );
    const warnings = await this.bookingWarnings(request, totalAmount);
    const snapshot = this.proposalSnapshot(proposal, acceptedVersion);
    const agreementText = this.buildStructuredAgreement(
      proposal.vendor.businessName,
      request,
      acceptedVersion,
      milestones,
      warnings,
    );

    const booking = await this.prisma.$transaction(async (tx) => {
      const createdBooking = await tx.booking.create({
        data: {
          proposalId: proposal.id,
          acceptedProposalVersionId: acceptedVersion.id,
          serviceRequestId: request.id,
          weddingId: request.weddingId,
          eventId: request.eventId,
          customerId: request.customerId,
          vendorId: proposal.vendorId,
          title: `${proposal.vendor.businessName} - ${request.title}`,
          totalAmount,
          currency: acceptedVersion.currency || 'PKR',
          status: 'PENDING_AGREEMENT',
          agreementText,
          agreementVersion: 1,
          lockedProposalSnapshot: snapshot,
          budgetWarnings: warnings,
          customerConfirmedAt: proposal.acceptedAt || new Date(),
          startsAt: eventDate,
        },
      });

      for (const eventId of eventIds) {
        await tx.bookingEvent.create({
          data: { bookingId: createdBooking.id, eventId },
        });
      }

      await this.reserveVendorAvailability(
        tx,
        proposal.vendorId,
        eventDate,
        acceptedVersion.teamSize,
      );

      for (const milestone of milestones) {
        const budgetItem = await tx.budgetItem.create({
          data: {
            weddingId: request.weddingId,
            title: `${createdBooking.title} - ${milestone.title}`,
            category: request.category?.name || 'Vendor booking',
            amount: milestone.amount,
            dueDate: milestone.dueDate,
            isPaid: false,
            notes: `Committed from booking ${createdBooking.id}.`,
          },
        });

        await tx.bookingPayment.create({
          data: {
            bookingId: createdBooking.id,
            budgetItemId: budgetItem.id,
            title: milestone.title,
            amount: milestone.amount,
            dueDate: milestone.dueDate,
            status: this.initialPaymentStatus(milestone.dueDate),
            notes: milestone.notes,
          },
        });
      }

      return createdBooking;
    });

    const fullBooking = await this.getBookingById(booking.id);
    await this.notificationsService.createNotification({
      recipientId: fullBooking.vendor.userId,
      type: 'BOOKING_UPDATE',
      title: 'New booking created',
      body: fullBooking.title,
      actionUrl: '/vendor/bookings',
      entityType: 'Booking',
      entityId: fullBooking.id,
    });
    await this.notificationsService.createActivity({
      actorId: fullBooking.customerId,
      weddingId: fullBooking.weddingId,
      bookingId: fullBooking.id,
      type: 'BOOKING',
      title: 'Booking created',
      body: fullBooking.title,
      entityType: 'Booking',
      entityId: fullBooking.id,
      metadata: { acceptedProposalVersionId: acceptedVersion.id, warnings },
    });

    return fullBooking;
  }

  async listCustomerBookings(userId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { customerId: userId },
      include: this.bookingInclude(),
      orderBy: { updatedAt: 'desc' },
    });
    return Promise.all(bookings.map((booking) => this.enrichBooking(booking)));
  }

  async listVendorBookings(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    const bookings = await this.prisma.booking.findMany({
      where: { vendorId: vendor.id },
      include: this.bookingInclude(),
      orderBy: { updatedAt: 'desc' },
    });
    return Promise.all(bookings.map((booking) => this.enrichBooking(booking)));
  }

  async listWeddingBookings(userId: string, weddingId: string) {
    const wedding = await this.prisma.wedding.findFirst({
      where: { id: weddingId, ownerId: userId },
    });
    if (!wedding) {
      throw new NotFoundException('Wedding not found');
    }

    const bookings = await this.prisma.booking.findMany({
      where: { weddingId },
      include: this.bookingInclude(),
      orderBy: { updatedAt: 'desc' },
    });
    return Promise.all(bookings.map((booking) => this.enrichBooking(booking)));
  }

  async getBooking(userId: string, bookingId: string) {
    await this.ensureBookingAccess(userId, bookingId);
    await this.refreshOverduePayments(bookingId);
    return this.getBookingById(bookingId);
  }

  async confirmCustomer(userId: string, bookingId: string) {
    const booking = await this.ensureCustomerBooking(userId, bookingId);
    this.ensureAgreementCanBeConfirmed(booking);
    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        customerConfirmedAt: new Date(),
        agreedAt: booking.vendorConfirmedAt ? new Date() : booking.agreedAt,
        status: booking.vendorConfirmedAt ? 'CONFIRMED' : booking.status,
      },
      include: this.bookingInclude(),
    });
    await this.notifyBookingParticipant(
      updated,
      userId,
      'Customer confirmed agreement',
      'BOOKING_UPDATE',
    );
    return this.enrichBooking(updated);
  }

  async confirmVendor(userId: string, bookingId: string) {
    const booking = await this.ensureVendorBooking(userId, bookingId);
    this.ensureAgreementCanBeConfirmed(booking);
    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        vendorConfirmedAt: new Date(),
        agreedAt: booking.customerConfirmedAt ? new Date() : booking.agreedAt,
        status: booking.customerConfirmedAt ? 'CONFIRMED' : booking.status,
      },
      include: this.bookingInclude(),
    });
    await this.notifyBookingParticipant(
      updated,
      userId,
      'Vendor confirmed agreement',
      'BOOKING_UPDATE',
    );
    return this.enrichBooking(updated);
  }

  async setBookingStatus(
    userId: string,
    bookingId: string,
    status: BookingTransition,
  ) {
    const booking = await this.ensureBookingAccess(userId, bookingId);
    this.ensureBookingTransition(booking.status, status);
    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status },
      include: this.bookingInclude(),
    });
    await this.notifyBookingParticipant(
      updated,
      userId,
      `Booking marked ${status.replaceAll('_', ' ').toLowerCase()}`,
      'BOOKING_UPDATE',
    );
    return this.enrichBooking(updated);
  }

  async cancelBooking(userId: string, bookingId: string, reason?: string) {
    const booking = await this.ensureBookingAccess(userId, bookingId);
    if (booking.status === 'COMPLETED') {
      throw new BadRequestException('Completed bookings cannot be cancelled');
    }
    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED', cancellationReason: reason },
      include: this.bookingInclude(),
    });
    await this.releaseVendorAvailability(updated);
    await this.notifyBookingParticipant(
      updated,
      userId,
      'Booking cancelled',
      'BOOKING_UPDATE',
    );
    return this.enrichBooking(updated);
  }

  async addPayment(userId: string, bookingId: string, dto: any) {
    const booking = await this.ensureCustomerBooking(userId, bookingId);
    const amount = this.toNumber(dto.amount);
    if (!dto.title || !amount || amount <= 0) {
      throw new BadRequestException('Payment title and amount are required');
    }

    const budgetItem = await this.prisma.budgetItem.create({
      data: {
        weddingId: booking.weddingId,
        title: `${booking.title} - ${dto.title}`,
        category: booking.serviceRequest?.category?.name || 'Vendor booking',
        amount,
        dueDate: this.toDate(dto.dueDate),
        isPaid: dto.status === 'PAID',
        notes: dto.notes,
      },
    });

    await this.prisma.bookingPayment.create({
      data: {
        bookingId,
        budgetItemId: budgetItem.id,
        title: dto.title,
        amount,
        dueDate: this.toDate(dto.dueDate),
        status:
          dto.status || this.initialPaymentStatus(this.toDate(dto.dueDate)),
        notes: dto.notes,
      },
    });

    const updated = await this.syncBookingBudget(userId, bookingId);
    await this.notifyBookingParticipant(
      updated,
      userId,
      `Payment milestone added: ${dto.title}`,
      'PAYMENT_UPDATE',
    );
    return updated;
  }

  async updatePayment(
    userId: string,
    bookingId: string,
    paymentId: string,
    dto: any,
  ) {
    await this.ensureCustomerBooking(userId, bookingId);
    const payment = await this.ensurePayment(bookingId, paymentId);
    const amount = this.toNumber(dto.amount);
    const dueDate =
      dto.dueDate === undefined ? undefined : this.toDate(dto.dueDate);

    const updatedPayment = await this.prisma.bookingPayment.update({
      where: { id: paymentId },
      data: {
        title: dto.title,
        amount,
        dueDate,
        status: dto.status,
        notes: dto.notes,
      },
    });

    if (payment.budgetItemId) {
      await this.prisma.budgetItem.update({
        where: { id: payment.budgetItemId },
        data: {
          title: dto.title
            ? `${payment.booking.title} - ${dto.title}`
            : undefined,
          amount,
          dueDate,
          isPaid: dto.status === undefined ? undefined : dto.status === 'PAID',
          notes: dto.notes,
        },
      });
    }

    const updatedBooking = await this.syncBookingBudget(userId, bookingId);
    await this.notifyBookingParticipant(
      updatedBooking,
      userId,
      `Payment milestone updated: ${updatedPayment.title}`,
      'PAYMENT_UPDATE',
    );
    return { payment: updatedPayment, booking: updatedBooking };
  }

  async recordPayment(
    userId: string,
    bookingId: string,
    paymentId: string,
    dto: any,
  ) {
    await this.ensureCustomerBooking(userId, bookingId);
    const payment = await this.ensurePayment(bookingId, paymentId);
    this.ensurePaymentMethod(dto.method);

    const amount = this.toNumber(dto.amount) || Number(payment.amount || 0);
    if (amount <= 0 || amount > Number(payment.amount || 0)) {
      throw new BadRequestException('Recorded amount must fit the milestone');
    }

    await this.prisma.bookingPayment.update({
      where: { id: paymentId },
      data: {
        status: 'DUE',
        method: dto.method,
        reference: dto.reference,
        receiptUrl: dto.receiptUrl,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
        notes: dto.notes ?? payment.notes,
      },
    });

    const updated = await this.syncBookingBudget(userId, bookingId);
    await this.notifyBookingParticipant(
      updated,
      userId,
      `Payment recorded: ${payment.title}`,
      'PAYMENT_UPDATE',
    );
    return updated;
  }

  async verifyPayment(
    userId: string,
    bookingId: string,
    paymentId: string,
    dto: any = {},
  ) {
    const booking = await this.ensureVendorBooking(userId, bookingId);
    const payment = await this.ensurePayment(bookingId, paymentId);
    if (!payment.paidAt) {
      throw new BadRequestException('Payment has not been recorded');
    }

    await this.prisma.bookingPayment.update({
      where: { id: paymentId },
      data: {
        status: dto.status === 'REFUNDED' ? 'REFUNDED' : 'PAID',
        verifiedAt: new Date(),
        verifiedById: userId,
        verificationNote: dto.note,
      },
    });

    if (payment.budgetItemId) {
      await this.prisma.budgetItem.update({
        where: { id: payment.budgetItemId },
        data: {
          isPaid: dto.status === 'REFUNDED' ? false : true,
          notes: dto.note ?? payment.notes,
        },
      });
    }

    const updated = await this.syncBookingBudget(booking.customerId, bookingId);
    await this.notifyBookingParticipant(
      updated,
      userId,
      `Payment verified: ${payment.title}`,
      'PAYMENT_UPDATE',
    );
    return updated;
  }

  async markPaymentPaid(
    userId: string,
    bookingId: string,
    paymentId: string,
    dto: any,
  ) {
    const booking = await this.ensureBookingAccess(userId, bookingId);
    if (booking.customerId === userId) {
      return this.recordPayment(userId, bookingId, paymentId, dto);
    }
    return this.verifyPayment(userId, bookingId, paymentId, dto);
  }

  async syncBookingBudget(userId: string, bookingId: string) {
    await this.ensureCustomerBooking(userId, bookingId);
    await this.refreshOverduePayments(bookingId);
    const booking = await this.getBookingByIdRaw(bookingId);

    for (const payment of booking.payments) {
      if (!payment.budgetItemId) {
        const budgetItem = await this.prisma.budgetItem.create({
          data: {
            weddingId: booking.weddingId,
            title: `${booking.title} - ${payment.title}`,
            category: booking.serviceRequest.category?.name || 'Vendor booking',
            amount: payment.amount,
            dueDate: payment.dueDate,
            isPaid: payment.status === 'PAID',
            notes: payment.notes,
          },
        });
        await this.prisma.bookingPayment.update({
          where: { id: payment.id },
          data: { budgetItemId: budgetItem.id },
        });
      } else {
        await this.prisma.budgetItem.update({
          where: { id: payment.budgetItemId },
          data: {
            amount: payment.amount,
            dueDate: payment.dueDate,
            isPaid: payment.status === 'PAID',
            notes: payment.notes,
          },
        });
      }
    }

    const warnings = await this.bookingWarnings(
      booking.serviceRequest,
      Number(booking.totalAmount || 0),
      booking.id,
    );
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { budgetWarnings: warnings },
    });

    const updated = await this.getBookingById(bookingId);
    await this.notificationsService.createActivity({
      actorId: userId,
      weddingId: updated.weddingId,
      bookingId,
      type: 'PAYMENT',
      title: 'Booking budget synced',
      body: updated.title,
      entityType: 'Booking',
      entityId: bookingId,
      metadata: { financialSummary: updated.financialSummary, warnings },
    });
    return updated;
  }

  async listWeddingDayOperations(userId: string, weddingId: string) {
    const wedding = await this.prisma.wedding.findFirst({
      where: {
        id: weddingId,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: { userId, status: 'ACCEPTED', removedAt: null },
            },
          },
        ],
      },
    });
    if (!wedding) {
      throw new NotFoundException('Wedding not found');
    }

    const bookings = await this.prisma.booking.findMany({
      where: { weddingId, status: { not: 'CANCELLED' } },
      include: this.bookingInclude(),
      orderBy: [{ startsAt: 'asc' }, { createdAt: 'asc' }],
    });

    return {
      weddingId,
      coordinator: wedding.mainCoordinator,
      bookings: bookings.map((booking: any) => ({
        ...this.enrichBooking(booking),
        currentOperationStatus:
          booking.operationStatuses?.[0]?.status || 'SCHEDULED',
        delayReason: booking.operationStatuses?.[0]?.delayReason || null,
      })),
    };
  }

  async updateOperationStatus(
    userId: string,
    bookingId: string,
    dto: {
      status: VendorOperationStatus;
      note?: string;
      delayReason?: string;
      occurredAt?: string;
    },
  ) {
    const booking = await this.ensureBookingAccess(userId, bookingId);
    this.ensureOperationStatus(dto.status, dto.delayReason);

    const status = await this.prisma.bookingOperationStatus.create({
      data: {
        bookingId,
        status: dto.status,
        note: dto.note,
        delayReason: dto.delayReason,
        actorId: userId,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
      },
    });

    await this.notificationsService.createActivity({
      actorId: userId,
      weddingId: booking.weddingId,
      bookingId,
      type: 'BOOKING',
      title: `Vendor status: ${dto.status.replaceAll('_', ' ').toLowerCase()}`,
      body: dto.delayReason || dto.note,
      entityType: 'BookingOperationStatus',
      entityId: status.id,
      metadata: { status: dto.status, delayReason: dto.delayReason },
    });

    const updated = await this.getBookingById(bookingId);
    return {
      status,
      booking: {
        ...updated,
        currentOperationStatus: dto.status,
        delayReason: dto.delayReason || null,
      },
    };
  }

  private async ensureBookingAccess(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        OR: [{ customerId: userId }, { vendor: { userId } }],
      },
      include: { vendor: true },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  private async ensureCustomerBooking(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, customerId: userId },
      include: this.bookingInclude(),
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  private async ensureVendorBooking(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, vendor: { userId } },
      include: this.bookingInclude(),
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  private async ensurePayment(bookingId: string, paymentId: string) {
    const payment = await this.prisma.bookingPayment.findFirst({
      where: { id: paymentId, bookingId },
      include: { booking: true },
    });
    if (!payment) {
      throw new NotFoundException('Payment milestone not found');
    }
    return payment;
  }

  private async getBookingById(bookingId: string) {
    const booking = await this.getBookingByIdRaw(bookingId);
    return this.enrichBooking(booking);
  }

  private async getBookingByIdRaw(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: this.bookingInclude(),
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  private bookingInclude() {
    return {
      customer: {
        select: { id: true, fullName: true, email: true, phone: true },
      },
      vendor: true,
      proposal: {
        include: {
          versions: { orderBy: { versionNumber: 'desc' as const } },
        },
      },
      acceptedProposalVersion: true,
      serviceRequest: {
        include: { category: true, wedding: true, event: true },
      },
      wedding: true,
      event: true,
      events: { include: { event: true } },
      operationStatuses: {
        orderBy: { occurredAt: 'desc' as const },
      },
      payments: {
        orderBy: [{ dueDate: 'asc' as const }, { createdAt: 'asc' as const }],
      },
    };
  }

  private defaultMilestones(
    totalAmount: number,
    advanceAmount: number,
    eventDate?: Date,
  ) {
    const dueBeforeEvent = eventDate
      ? new Date(eventDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      : undefined;
    if (advanceAmount > 0 && advanceAmount < totalAmount) {
      return [
        {
          title: 'Advance payment',
          amount: advanceAmount,
          dueDate: new Date(),
          notes: 'Advance milestone from accepted proposal.',
        },
        {
          title: 'Final payment',
          amount: totalAmount - advanceAmount,
          dueDate: dueBeforeEvent,
          notes: 'Final milestone from accepted proposal.',
        },
      ];
    }

    return [
      {
        title: 'Full payment',
        amount: totalAmount,
        dueDate: dueBeforeEvent,
        notes: 'Single milestone from accepted proposal.',
      },
    ];
  }

  private buildStructuredAgreement(
    vendorName: string,
    request: any,
    latest: any,
    milestones: any[],
    warnings: string[],
  ) {
    const agreement = {
      title: `Agreement for ${request.title}`,
      parties: {
        customerId: request.customerId,
        vendorName,
      },
      weddingId: request.weddingId,
      eventIds: this.uniqueIds([request.eventId]),
      category: request.category?.name,
      eventDate: request.eventDate,
      proposalVersion: latest.versionNumber,
      package: {
        description: latest.packageDescription,
        inclusions: latest.inclusions || [],
        exclusions: latest.exclusions || [],
        addOns: latest.addOns || [],
        teamSize: latest.teamSize,
        setupTime: latest.setupTime,
        deliveryTime: latest.deliveryTime,
      },
      commercialTerms: {
        totalPrice: Number(latest.totalPrice || 0),
        currency: latest.currency || 'PKR',
        advanceAmount: latest.advanceAmount
          ? Number(latest.advanceAmount)
          : undefined,
        paymentSchedule: latest.paymentSchedule,
        cancellationPolicy: latest.cancellationPolicy,
        validityDate: latest.validityDate,
        terms: latest.terms,
      },
      milestones: milestones.map((milestone) => ({
        title: milestone.title,
        amount: milestone.amount,
        dueDate: milestone.dueDate,
      })),
      warnings,
      gatewayPolicy: 'Manual or simulated payments only; no real gateway used.',
    };

    return JSON.stringify(agreement, null, 2);
  }

  private proposalSnapshot(proposal: any, latest: any) {
    return {
      proposalId: proposal.id,
      acceptedProposalVersionId: latest.id,
      versionNumber: latest.versionNumber,
      vendorId: proposal.vendorId,
      serviceRequestId: proposal.serviceRequestId,
      totalPrice: Number(latest.totalPrice || 0),
      currency: latest.currency || 'PKR',
      packageDescription: latest.packageDescription,
      inclusions: latest.inclusions || [],
      exclusions: latest.exclusions || [],
      addOns: latest.addOns || [],
      paymentSchedule: latest.paymentSchedule,
      cancellationPolicy: latest.cancellationPolicy,
      validityDate: latest.validityDate,
      acceptedAt: proposal.acceptedAt,
    };
  }

  private async reserveVendorAvailability(
    tx: any,
    vendorId: string,
    eventDate?: Date | null,
    teamSize?: number | null,
  ) {
    if (!eventDate) return;
    const existing = await tx.vendorAvailability.findFirst({
      where: {
        vendorId,
        date: eventDate,
        status: { in: ['AVAILABLE', 'PARTIALLY_AVAILABLE'] },
      },
    });
    if (existing) {
      await tx.vendorAvailability.update({
        where: { id: existing.id },
        data: {
          status: 'TENTATIVELY_RESERVED',
          capacity: teamSize || existing.capacity,
          notes: 'Reserved after accepted proposal.',
        },
      });
      return;
    }

    await tx.vendorAvailability.create({
      data: {
        vendorId,
        date: eventDate,
        status: 'TENTATIVELY_RESERVED',
        capacity: teamSize || 1,
        notes: 'Reserved after accepted proposal.',
      },
    });
  }

  private async releaseVendorAvailability(booking: any) {
    const eventDate = booking.startsAt || booking.serviceRequest?.eventDate;
    if (!eventDate) return;
    await this.prisma.vendorAvailability.updateMany({
      where: {
        vendorId: booking.vendorId,
        date: eventDate,
        status: 'TENTATIVELY_RESERVED',
      },
      data: { status: 'AVAILABLE', notes: 'Released after booking cancel.' },
    });
  }

  private async bookingWarnings(
    request: any,
    totalAmount: number,
    excludeBookingId?: string,
  ) {
    const warnings: string[] = [];
    const existingBookings = await this.prisma.booking.findMany({
      where: {
        weddingId: request.weddingId,
        status: { not: 'CANCELLED' },
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      },
      include: { serviceRequest: { include: { category: true } } },
    });
    const categoryName = request.category?.name;
    if (
      categoryName &&
      existingBookings.some(
        (booking: any) =>
          booking.serviceRequest?.category?.name?.toLowerCase() ===
          categoryName.toLowerCase(),
      )
    ) {
      warnings.push(`Duplicate category booking: ${categoryName}`);
    }

    const committed = existingBookings.reduce(
      (sum: number, booking: any) => sum + Number(booking.totalAmount || 0),
      0,
    );
    const estimatedBudget = Number(request.wedding?.estimatedBudget || 0);
    if (estimatedBudget && committed + totalAmount > estimatedBudget) {
      warnings.push(
        `Over-budget warning: committed ${committed + totalAmount} exceeds wedding budget ${estimatedBudget}`,
      );
    }

    return warnings;
  }

  private ensureAgreementCanBeConfirmed(booking: any) {
    if (!['PENDING_AGREEMENT', 'CONFIRMED'].includes(booking.status)) {
      throw new BadRequestException(
        'Agreement can only be confirmed before work starts',
      );
    }
  }

  private ensureBookingTransition(current: string, next: BookingTransition) {
    const allowed: Record<string, string[]> = {
      CONFIRMED: ['IN_PROGRESS'],
      IN_PROGRESS: ['COMPLETED'],
    };
    if (!allowed[current]?.includes(next)) {
      throw new BadRequestException(
        `Cannot move booking from ${current} to ${next}`,
      );
    }
  }

  private ensurePaymentMethod(method?: string) {
    if (
      !method ||
      !PAYMENT_METHODS.includes(method as SupportedPaymentMethod)
    ) {
      throw new BadRequestException('Unsupported payment method');
    }
  }

  private ensureOperationStatus(
    status: VendorOperationStatus,
    delayReason?: string,
  ) {
    const statuses: VendorOperationStatus[] = [
      'SCHEDULED',
      'ON_THE_WAY',
      'ARRIVED',
      'SETTING_UP',
      'READY',
      'ACTIVE_SERVICE',
      'COMPLETED',
      'DELAYED',
    ];
    if (!statuses.includes(status)) {
      throw new BadRequestException('Unsupported vendor operation status');
    }
    if (status === 'DELAYED' && !delayReason?.trim()) {
      throw new BadRequestException('Delay reason is required');
    }
  }

  private async refreshOverduePayments(bookingId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdue = await this.prisma.bookingPayment.findMany({
      where: {
        bookingId,
        status: { in: ['PENDING', 'DUE'] },
        dueDate: { lt: today },
      },
    });
    for (const payment of overdue) {
      await this.prisma.bookingPayment.update({
        where: { id: payment.id },
        data: { status: 'OVERDUE' },
      });
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: { customer: true, vendor: true },
      });
      if (booking) {
        await this.notificationsService.createNotification({
          recipientId: booking.customerId,
          type: 'PAYMENT_UPDATE',
          priority: 'HIGH',
          title: 'Payment milestone overdue',
          body: `${booking.title} - ${payment.title}`,
          actionUrl: '/customer/bookings',
          entityType: 'BookingPayment',
          entityId: payment.id,
        });
      }
    }
  }

  private enrichBooking(booking: any) {
    return {
      ...booking,
      financialSummary: this.financialSummary(booking),
      warnings: booking.budgetWarnings || [],
    };
  }

  private financialSummary(booking: any) {
    const totalAmount = Number(booking.totalAmount || 0);
    const paidAmount = (booking.payments || [])
      .filter((payment: any) => payment.status === 'PAID')
      .reduce(
        (sum: number, payment: any) => sum + Number(payment.amount || 0),
        0,
      );
    const pendingVerificationAmount = (booking.payments || [])
      .filter((payment: any) => payment.paidAt && payment.status !== 'PAID')
      .reduce(
        (sum: number, payment: any) => sum + Number(payment.amount || 0),
        0,
      );
    const overdueAmount = (booking.payments || [])
      .filter((payment: any) => payment.status === 'OVERDUE')
      .reduce(
        (sum: number, payment: any) => sum + Number(payment.amount || 0),
        0,
      );
    const outstandingAmount = Math.max(totalAmount - paidAmount, 0);
    return {
      totalAmount,
      paidAmount,
      outstandingAmount,
      pendingVerificationAmount,
      overdueAmount,
      milestoneCount: booking.payments?.length || 0,
      paidMilestoneCount:
        booking.payments?.filter((payment: any) => payment.status === 'PAID')
          .length || 0,
    };
  }

  private initialPaymentStatus(dueDate?: Date | null) {
    if (!dueDate) return 'PENDING';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate.getTime() < today.getTime() ? 'OVERDUE' : 'DUE';
  }

  private toDate(value: unknown) {
    if (!value) return undefined;
    return new Date(String(value));
  }

  private toNumber(value: unknown) {
    if (value === undefined || value === null || value === '') return undefined;
    return Number(value);
  }

  private uniqueIds(values: Array<string | null | undefined>) {
    return Array.from(new Set(values.filter(Boolean) as string[]));
  }

  private async notifyBookingParticipant(
    booking: any,
    actorId: string,
    title: string,
    type: 'BOOKING_UPDATE' | 'PAYMENT_UPDATE',
  ) {
    const recipientId =
      actorId === booking.customerId
        ? booking.vendor?.userId
        : booking.customerId;
    if (recipientId) {
      await this.notificationsService.createNotification({
        recipientId,
        actorId,
        type,
        title,
        body: booking.title,
        actionUrl:
          actorId === booking.customerId
            ? '/vendor/bookings'
            : '/customer/bookings',
        entityType: 'Booking',
        entityId: booking.id,
      });
    }

    await this.notificationsService.createActivity({
      actorId,
      weddingId: booking.weddingId,
      bookingId: booking.id,
      type: type === 'PAYMENT_UPDATE' ? 'PAYMENT' : 'BOOKING',
      title,
      body: booking.title,
      entityType: 'Booking',
      entityId: booking.id,
    });
  }
}
