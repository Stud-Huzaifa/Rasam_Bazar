import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async dashboard() {
    const [
      users,
      suspendedUsers,
      vendors,
      pendingVerifications,
      openDisputes,
      flaggedReviews,
      bookings,
      completedBookings,
      incidents,
      serviceCategories,
      serviceListings,
      overduePayments,
      auditEvents,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { isSuspended: true, deletedAt: null } }),
      this.prisma.vendor.count({ where: { isActive: true } }),
      this.prisma.vendorVerification.count({ where: { status: 'PENDING' } }),
      this.prisma.bookingDispute.count({
        where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } },
      }),
      this.prisma.vendorReview.count({ where: { status: 'FLAGGED' } }),
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { status: 'COMPLETED' } }),
      this.prisma.bookingIncident.count({
        where: { status: { in: ['OPEN', 'VENDOR_RESPONDED'] } },
      }),
      this.prisma.serviceCategory.count(),
      this.prisma.serviceListing.count({ where: { isActive: true } }),
      this.prisma.bookingPayment.count({
        where: { status: { in: ['DUE', 'OVERDUE'] } },
      }),
      this.prisma.auditLog.count(),
    ]);

    const recentActivity = await this.prisma.activityEvent.findMany({
      include: { actor: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    return {
      metrics: {
        users,
        suspendedUsers,
        vendors,
        pendingVerifications,
        openDisputes,
        flaggedReviews,
        bookings,
        completedBookings,
        incidents,
        serviceCategories,
        serviceListings,
        overduePayments,
        auditEvents,
      },
      recentActivity,
    };
  }

  async listUsers(query: any = {}) {
    const where: any = { deletedAt: null };
    if (query.q) {
      where.OR = [
        { email: { contains: query.q, mode: 'insensitive' } },
        { fullName: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    if (query.suspended === 'true') {
      where.isSuspended = true;
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        city: true,
        isActive: true,
        isSuspended: true,
        isEmailVerified: true,
        createdAt: true,
        roles: { include: { role: true } },
        vendor: {
          select: { id: true, businessName: true, verificationStatus: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: this.skip(query),
      take: this.take(query.take),
    });
  }

  async listVendors(query: any = {}) {
    const where: any = {};
    if (query.q) {
      where.OR = [
        { businessName: { contains: query.q, mode: 'insensitive' } },
        { ownerName: { contains: query.q, mode: 'insensitive' } },
        { city: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    if (query.status) where.verificationStatus = query.status;
    if (query.active === 'true') where.isActive = true;
    if (query.active === 'false') where.isActive = false;

    return this.prisma.vendor.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, fullName: true } },
        services: { include: { category: true } },
        reviews: { take: 5, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      skip: this.skip(query),
      take: this.take(query.take),
    });
  }

  async updateUserStatus(actorId: string, userId: string, dto: any) {
    if (
      actorId === userId &&
      (dto.isSuspended === true || dto.isActive === false)
    ) {
      throw new BadRequestException('Admins cannot disable their own account');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: dto.isSuspended,
        isActive: dto.isActive,
        deletedAt: dto.deleted ? new Date() : undefined,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
        isSuspended: true,
        deletedAt: true,
      },
    });

    await this.audit(
      actorId,
      'ADMIN_USER_STATUS_UPDATE',
      'User',
      userId,
      user,
      updated,
    );
    return updated;
  }

  async listVendorVerifications(query: any = {}) {
    return this.prisma.vendorVerification.findMany({
      where: query.status ? { status: query.status } : undefined,
      include: {
        vendor: {
          include: { user: { select: { fullName: true, email: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: this.skip(query),
      take: this.take(query.take),
    });
  }

  async listServiceCategories(query: any = {}) {
    const where: any = query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: 'insensitive' as const } },
            { slug: { contains: query.q, mode: 'insensitive' as const } },
          ],
        }
      : undefined;
    return this.prisma.serviceCategory.findMany({
      where,
      include: {
        _count: { select: { services: true, serviceRequests: true } },
      },
      orderBy: { name: 'asc' },
      skip: this.skip(query),
      take: this.take(query.take),
    });
  }

  async listListings(query: any = {}) {
    const where: any = {};
    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    if (query.active === 'true') where.isActive = true;
    if (query.active === 'false') where.isActive = false;
    if (query.categoryId) where.categoryId = query.categoryId;

    return this.prisma.serviceListing.findMany({
      where,
      include: { vendor: true, category: true },
      orderBy: { updatedAt: 'desc' },
      skip: this.skip(query),
      take: this.take(query.take),
    });
  }

  async moderateListing(actorId: string, listingId: string, dto: any) {
    const listing = await this.prisma.serviceListing.findUnique({
      where: { id: listingId },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    const updated = await this.prisma.serviceListing.update({
      where: { id: listingId },
      data: {
        isActive: dto.isActive,
        description: dto.description,
      },
      include: { vendor: true, category: true },
    });
    await this.audit(
      actorId,
      'ADMIN_LISTING_MODERATION',
      'ServiceListing',
      listingId,
      listing,
      updated,
    );
    return updated;
  }

  async reviewVendorVerification(
    actorId: string,
    verificationId: string,
    dto: any,
  ) {
    const verification = await this.prisma.vendorVerification.findUnique({
      where: { id: verificationId },
      include: { vendor: true },
    });
    if (!verification) {
      throw new NotFoundException('Verification not found');
    }
    if (
      ![
        'APPROVED',
        'REJECTED',
        'MORE_INFORMATION_REQUIRED',
        'PENDING',
      ].includes(dto.status)
    ) {
      throw new BadRequestException('Invalid verification status');
    }

    const updated = await this.prisma.vendorVerification.update({
      where: { id: verificationId },
      data: {
        status: dto.status,
        reviewedById: actorId,
        reviewedAt: new Date(),
        reviewComment: dto.reviewComment,
      },
      include: { vendor: true },
    });

    const vendorData: any = { verificationStatus: dto.status };
    if (dto.status === 'APPROVED') {
      vendorData.verificationLevel =
        dto.verificationLevel || 'BUSINESS_VERIFIED';
    }
    if (dto.status === 'REJECTED') {
      vendorData.verificationLevel = 'UNVERIFIED';
    }

    await this.prisma.vendor.update({
      where: { id: verification.vendorId },
      data: vendorData,
    });
    await this.audit(
      actorId,
      'ADMIN_VENDOR_VERIFICATION_REVIEW',
      'VendorVerification',
      verificationId,
      verification,
      updated,
    );
    return updated;
  }

  async updateVendorStatus(actorId: string, vendorId: string, dto: any) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const suspend = dto.status === 'SUSPENDED' || dto.isActive === false;
    const updated = await this.prisma.vendor.update({
      where: { id: vendorId },
      data: {
        isActive: suspend ? false : (dto.isActive ?? vendor.isActive),
        verificationStatus: dto.status || vendor.verificationStatus,
      },
    });

    if (suspend) {
      await this.prisma.user.update({
        where: { id: vendor.userId },
        data: { isSuspended: true },
      });
    }

    await this.audit(
      actorId,
      'ADMIN_VENDOR_STATUS_UPDATE',
      'Vendor',
      vendorId,
      vendor,
      updated,
    );
    return updated;
  }

  async listReviews(query: any = {}) {
    return this.prisma.vendorReview.findMany({
      where: query.status ? { status: query.status } : undefined,
      include: {
        vendor: true,
        customer: { select: { fullName: true, email: true } },
        booking: true,
      },
      orderBy: { createdAt: 'desc' },
      take: this.take(query.take),
    });
  }

  async moderateReview(actorId: string, reviewId: string, dto: any) {
    const review = await this.prisma.vendorReview.findUnique({
      where: { id: reviewId },
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    if (!['PUBLISHED', 'HIDDEN', 'FLAGGED', 'REMOVED'].includes(dto.status)) {
      throw new BadRequestException('Invalid review status');
    }

    const updated = await this.prisma.vendorReview.update({
      where: { id: reviewId },
      data: {
        status: dto.status,
        visibility: dto.visibility,
      },
      include: {
        vendor: true,
        customer: { select: { fullName: true, email: true } },
      },
    });
    await this.audit(
      actorId,
      'ADMIN_REVIEW_MODERATION',
      'VendorReview',
      reviewId,
      review,
      updated,
    );
    await this.refreshTrustSignals(review.vendorId);
    return updated;
  }

  async listBookings(query: any = {}) {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        {
          vendor: { businessName: { contains: query.q, mode: 'insensitive' } },
        },
        { customer: { email: { contains: query.q, mode: 'insensitive' } } },
      ];
    }
    return this.prisma.booking.findMany({
      where,
      include: {
        customer: true,
        vendor: true,
        serviceRequest: true,
        payments: true,
      },
      orderBy: { updatedAt: 'desc' },
      skip: this.skip(query),
      take: this.take(query.take),
    });
  }

  async listPayments(query: any = {}) {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.method) where.method = query.method;
    return this.prisma.bookingPayment.findMany({
      where,
      include: { booking: { include: { vendor: true, customer: true } } },
      orderBy: [{ dueDate: 'asc' }, { updatedAt: 'desc' }],
      skip: this.skip(query),
      take: this.take(query.take),
    });
  }

  async listDisputes(query: any = {}) {
    return this.prisma.bookingDispute.findMany({
      where: query.status ? { status: query.status } : undefined,
      include: {
        booking: true,
        vendor: true,
        openedBy: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: this.skip(query),
      take: this.take(query.take),
    });
  }

  async moderateDispute(actorId: string, disputeId: string, dto: any) {
    const dispute = await this.prisma.bookingDispute.findUnique({
      where: { id: disputeId },
    });
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }
    if (
      !['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CANCELLED'].includes(dto.status)
    ) {
      throw new BadRequestException('Invalid dispute status');
    }

    const updated = await this.prisma.bookingDispute.update({
      where: { id: disputeId },
      data: {
        status: dto.status,
        supportNote: dto.supportNote,
        adminDecision: dto.adminDecision,
        reviewedById: dto.supportNote ? actorId : undefined,
        decidedById: dto.adminDecision ? actorId : undefined,
        resolutionNote: dto.resolutionNote,
        resolvedAt: ['RESOLVED', 'CANCELLED'].includes(dto.status)
          ? new Date()
          : undefined,
      },
      include: { booking: true, vendor: true },
    });

    if (dto.status === 'RESOLVED' && dispute.bookingId) {
      await this.prisma.booking.update({
        where: { id: dispute.bookingId },
        data: { status: 'COMPLETED' },
      });
    }

    await this.audit(
      actorId,
      'ADMIN_DISPUTE_MODERATION',
      'BookingDispute',
      disputeId,
      dispute,
      updated,
    );
    return updated;
  }

  async listIncidents(query: any = {}) {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.severity) where.severity = query.severity;
    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
        {
          vendor: { businessName: { contains: query.q, mode: 'insensitive' } },
        },
      ];
    }
    return this.prisma.bookingIncident.findMany({
      where,
      include: {
        booking: true,
        vendor: true,
        openedBy: { select: { id: true, fullName: true, email: true } },
        evidence: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: this.skip(query),
      take: this.take(query.take),
    });
  }

  async moderateIncident(actorId: string, incidentId: string, dto: any) {
    const incident = await this.prisma.bookingIncident.findUnique({
      where: { id: incidentId },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    if (
      ![
        'OPEN',
        'VENDOR_RESPONDED',
        'RESOLVED',
        'ESCALATED',
        'CANCELLED',
      ].includes(dto.status)
    ) {
      throw new BadRequestException('Invalid incident status');
    }
    const updated = await this.prisma.bookingIncident.update({
      where: { id: incidentId },
      data: {
        status: dto.status,
        resolutionNote: dto.resolutionNote,
        resolvedAt: ['RESOLVED', 'CANCELLED'].includes(dto.status)
          ? new Date()
          : undefined,
      },
      include: { booking: true, vendor: true, evidence: true },
    });
    await this.audit(
      actorId,
      'ADMIN_INCIDENT_MODERATION',
      'BookingIncident',
      incidentId,
      incident,
      updated,
    );
    return updated;
  }

  async reports() {
    const [users, vendors, bookings, payments, reviews, disputes, incidents] =
      await Promise.all([
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.vendor.count(),
        this.prisma.booking.count(),
        this.prisma.bookingPayment.findMany(),
        this.prisma.vendorReview.findMany(),
        this.prisma.bookingDispute.count(),
        this.prisma.bookingIncident.count(),
      ]);
    const paymentTotal = payments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );
    const averageRating =
      reviews.length === 0
        ? null
        : reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length;
    return {
      generatedAt: new Date(),
      users,
      vendors,
      bookings,
      paymentTotal,
      reviewCount: reviews.length,
      averageRating,
      disputes,
      incidents,
    };
  }

  async savedViews() {
    return [
      {
        id: 'pending-verifications',
        label: 'Pending verifications',
        target: 'vendor-verifications',
        filters: { status: 'PENDING' },
      },
      {
        id: 'flagged-reviews',
        label: 'Flagged reviews',
        target: 'reviews',
        filters: { status: 'FLAGGED' },
      },
      {
        id: 'open-disputes',
        label: 'Open disputes',
        target: 'disputes',
        filters: { status: 'OPEN' },
      },
      {
        id: 'overdue-payments',
        label: 'Overdue payments',
        target: 'payments',
        filters: { status: 'OVERDUE' },
      },
    ];
  }

  async auditLogs(query: any = {}) {
    return this.prisma.auditLog.findMany({
      where: query.entityType ? { entityType: query.entityType } : undefined,
      include: { actor: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: this.skip(query),
      take: this.take(query.take),
    });
  }

  private async refreshTrustSignals(vendorId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });
    if (!vendor) return;
    const [reviews, completedBookings, openDisputes] = await Promise.all([
      this.prisma.vendorReview.findMany({
        where: { vendorId, status: 'PUBLISHED' },
      }),
      this.prisma.booking.count({ where: { vendorId, status: 'COMPLETED' } }),
      this.prisma.bookingDispute.count({
        where: { vendorId, status: { in: ['OPEN', 'UNDER_REVIEW'] } },
      }),
    ]);
    const averageRating = reviews.length
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : null;
    await this.prisma.vendorTrustSignal.deleteMany({ where: { vendorId } });
    await this.prisma.vendorTrustSignal.createMany({
      data: [
        {
          vendorId,
          type: 'REVIEW_SCORE',
          label: 'Average customer rating',
          score:
            averageRating === null ? 0 : Math.round((averageRating / 5) * 100),
          weight: 3,
          source: 'admin_moderation',
        },
        {
          vendorId,
          type: 'COMPLETED_BOOKINGS',
          label: 'Completed platform bookings',
          score: Math.min(completedBookings * 20, 100),
          weight: 2,
          source: 'admin_moderation',
        },
        {
          vendorId,
          type: 'VERIFICATION',
          label: 'Verification level',
          score: this.verificationScore(vendor.verificationLevel) * 5,
          weight: 2,
          source: 'admin_moderation',
        },
        {
          vendorId,
          type: 'DISPUTE_RATE',
          label: 'Open dispute health',
          score: Math.max(0, 100 - openDisputes * 25),
          weight: 2,
          source: 'admin_moderation',
        },
      ],
    });
  }

  private async audit(
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    previousValue?: any,
    newValue?: any,
  ) {
    await this.prisma.auditLog.create({
      data: {
        actorId,
        action,
        entityType,
        entityId,
        previousValue: previousValue
          ? JSON.stringify(previousValue)
          : undefined,
        newValue: newValue ? JSON.stringify(newValue) : undefined,
      },
    });
  }

  private verificationScore(level: string) {
    switch (level) {
      case 'PLATFORM_TRUSTED':
        return 20;
      case 'BUSINESS_VERIFIED':
        return 16;
      case 'IDENTITY_VERIFIED':
        return 12;
      case 'PHONE_VERIFIED':
        return 8;
      default:
        return 2;
    }
  }

  private take(value: unknown) {
    const parsed = Number(value || 30);
    if (!Number.isFinite(parsed)) return 30;
    return Math.min(Math.max(parsed, 1), 100);
  }

  private skip(query: any = {}) {
    const page = Number(query.page || 1);
    const take = this.take(query.take);
    if (!Number.isFinite(page) || page <= 1) return 0;
    return (Math.floor(page) - 1) * take;
  }
}
