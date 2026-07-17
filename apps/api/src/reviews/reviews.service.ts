import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async submitReview(userId: string, bookingId: string, dto: any) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, customerId: userId },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.status !== 'COMPLETED') {
      throw new BadRequestException('Only completed bookings can be reviewed');
    }

    const existing = await this.prisma.vendorReview.findUnique({
      where: { bookingId },
    });
    if (existing) {
      throw new BadRequestException('Booking has already been reviewed');
    }

    const rating = this.rating(dto.rating);
    const review = await this.prisma.vendorReview.create({
      data: {
        bookingId,
        vendorId: booking.vendorId,
        customerId: userId,
        ...this.reviewData(dto, rating),
      },
      include: this.reviewInclude(),
    });

    await this.refreshTrustSignals(booking.vendorId);
    return review;
  }

  async updateReview(userId: string, reviewId: string, dto: any) {
    const review = await this.prisma.vendorReview.findFirst({
      where: { id: reviewId, customerId: userId },
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const updated = await this.prisma.vendorReview.update({
      where: { id: reviewId },
      data: this.reviewData(
        dto,
        dto.rating === undefined ? review.rating : this.rating(dto.rating),
      ),
      include: this.reviewInclude(),
    });
    await this.refreshTrustSignals(review.vendorId);
    return updated;
  }

  async respondToReview(userId: string, reviewId: string, response?: string) {
    const review = await this.prisma.vendorReview.findFirst({
      where: { id: reviewId, vendor: { userId } },
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    if (!response?.trim()) {
      throw new BadRequestException('Response is required');
    }

    return this.prisma.vendorReview.update({
      where: { id: reviewId },
      data: { vendorResponse: response.trim(), vendorRespondedAt: new Date() },
      include: this.reviewInclude(),
    });
  }

  async listCustomerReviews(userId: string) {
    return this.prisma.vendorReview.findMany({
      where: { customerId: userId },
      include: this.reviewInclude(),
      orderBy: { updatedAt: 'desc' },
    });
  }

  async listVendorReviews(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    return this.prisma.vendorReview.findMany({
      where: { vendorId: vendor.id },
      include: this.reviewInclude(),
      orderBy: { updatedAt: 'desc' },
    });
  }

  async listPublicVendorReviews(vendorId: string) {
    await this.ensureVendor(vendorId);
    return this.prisma.vendorReview.findMany({
      where: { vendorId, status: 'PUBLISHED', visibility: 'PUBLIC' },
      include: this.reviewInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async myVendorTrust(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    return this.vendorTrust(vendor.id);
  }

  async vendorTrust(vendorId: string) {
    const vendor = await this.ensureVendor(vendorId);
    const [reviews, completedBookings, disputes, signals] = await Promise.all([
      this.prisma.vendorReview.findMany({
        where: { vendorId, status: 'PUBLISHED' },
      }),
      this.prisma.booking.count({ where: { vendorId, status: 'COMPLETED' } }),
      this.prisma.bookingDispute.findMany({
        where: { vendorId, status: { in: ['OPEN', 'UNDER_REVIEW'] } },
      }),
      this.prisma.vendorTrustSignal.findMany({
        where: { vendorId },
        orderBy: { generatedAt: 'desc' },
        take: 20,
      }),
    ]);

    const averageRating = this.average(reviews.map((review) => review.rating));
    const recommendationRate = reviews.length
      ? Math.round(
          (reviews.filter((review) => review.wouldRecommend).length /
            reviews.length) *
            100,
        )
      : null;
    const reviewScore =
      averageRating === null ? 0 : Math.round((averageRating / 5) * 60);
    const completionScore = Math.min(completedBookings * 8, 20);
    const verificationScore = this.verificationScore(vendor.verificationLevel);
    const disputePenalty = Math.min(disputes.length * 10, 30);
    const trustScore = Math.max(
      0,
      Math.min(
        100,
        reviewScore + completionScore + verificationScore - disputePenalty,
      ),
    );

    return {
      vendorId,
      trustScore,
      averageRating,
      reviewCount: reviews.length,
      recommendationRate,
      completedBookings,
      openDisputes: disputes.length,
      verificationLevel: vendor.verificationLevel,
      signals,
    };
  }

  async openDispute(userId: string, bookingId: string, dto: any) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        customerId: userId,
      },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (!dto.reason?.trim()) {
      throw new BadRequestException('Dispute reason is required');
    }

    const dispute = await this.prisma.bookingDispute.create({
      data: {
        bookingId,
        vendorId: booking.vendorId,
        customerId: booking.customerId,
        openedById: userId,
        reason: dto.reason.trim(),
        details: dto.details,
        evidenceUrls: this.toStringArray(dto.evidenceUrls),
      },
      include: this.disputeInclude(),
    });
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'DISPUTED' },
    });
    await this.refreshTrustSignals(booking.vendorId);
    await this.audit(
      userId,
      'DISPUTE_OPENED',
      'BookingDispute',
      dispute.id,
      null,
      dispute,
    );
    return dispute;
  }

  async updateDispute(userId: string, disputeId: string, dto: any) {
    const dispute = await this.prisma.bookingDispute.findFirst({
      where: {
        id: disputeId,
        OR: [{ customerId: userId }, { vendor: { userId } }],
      },
    });
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    const updated = await this.prisma.bookingDispute.update({
      where: { id: disputeId },
      data: {
        status: dto.status,
        resolutionNote: dto.resolutionNote,
        resolvedAt: ['RESOLVED', 'CANCELLED'].includes(dto.status)
          ? new Date()
          : undefined,
      },
      include: this.disputeInclude(),
    });
    await this.refreshTrustSignals(dispute.vendorId);
    return updated;
  }

  async uploadDisputeEvidence(userId: string, disputeId: string, dto: any) {
    const dispute = await this.ensureDisputeParticipant(userId, disputeId);
    if (!dto.fileUrl?.trim()) {
      throw new BadRequestException('Evidence file URL is required');
    }

    const evidence = await this.prisma.disputeEvidence.create({
      data: {
        disputeId,
        uploadedById: userId,
        fileUrl: dto.fileUrl.trim(),
        note: dto.note,
      },
    });
    await this.audit(
      userId,
      'DISPUTE_EVIDENCE_UPLOADED',
      'DisputeEvidence',
      evidence.id,
      null,
      evidence,
    );
    return { dispute, evidence };
  }

  async vendorDisputeResponse(userId: string, disputeId: string, dto: any) {
    const dispute = await this.prisma.bookingDispute.findFirst({
      where: { id: disputeId, vendor: { userId } },
    });
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }
    if (!dto.response?.trim()) {
      throw new BadRequestException('Vendor response is required');
    }

    const updated = await this.prisma.bookingDispute.update({
      where: { id: disputeId },
      data: {
        vendorResponse: dto.response.trim(),
        status: 'UNDER_REVIEW',
      },
      include: this.disputeInclude(),
    });
    await this.audit(
      userId,
      'DISPUTE_VENDOR_RESPONSE',
      'BookingDispute',
      disputeId,
      dispute,
      updated,
    );
    return updated;
  }

  async createIncident(userId: string, bookingId: string, dto: any) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        OR: [{ customerId: userId }, { vendor: { userId } }],
      },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (!dto.title?.trim()) {
      throw new BadRequestException('Incident title is required');
    }

    const incident = await this.prisma.bookingIncident.create({
      data: {
        bookingId,
        vendorId: booking.vendorId,
        customerId: booking.customerId,
        openedById: userId,
        title: dto.title.trim(),
        description: dto.description,
        severity: dto.severity || 'MEDIUM',
      },
      include: this.incidentInclude(),
    });
    await this.audit(
      userId,
      'INCIDENT_CREATED',
      'BookingIncident',
      incident.id,
      null,
      incident,
    );
    return incident;
  }

  async uploadIncidentEvidence(userId: string, incidentId: string, dto: any) {
    await this.ensureIncidentParticipant(userId, incidentId);
    if (!dto.fileUrl?.trim()) {
      throw new BadRequestException('Evidence file URL is required');
    }
    const evidence = await this.prisma.incidentEvidence.create({
      data: {
        incidentId,
        uploadedById: userId,
        fileUrl: dto.fileUrl.trim(),
        note: dto.note,
      },
    });
    await this.audit(
      userId,
      'INCIDENT_EVIDENCE_UPLOADED',
      'IncidentEvidence',
      evidence.id,
      null,
      evidence,
    );
    return evidence;
  }

  async vendorIncidentResponse(userId: string, incidentId: string, dto: any) {
    const incident = await this.prisma.bookingIncident.findFirst({
      where: { id: incidentId, vendor: { userId } },
    });
    if (!incident) {
      throw new NotFoundException('Incident not found');
    }
    if (!dto.response?.trim()) {
      throw new BadRequestException('Vendor response is required');
    }
    const updated = await this.prisma.bookingIncident.update({
      where: { id: incidentId },
      data: {
        vendorResponse: dto.response.trim(),
        status: 'VENDOR_RESPONDED',
      },
      include: this.incidentInclude(),
    });
    await this.audit(
      userId,
      'INCIDENT_VENDOR_RESPONSE',
      'BookingIncident',
      incidentId,
      incident,
      updated,
    );
    return updated;
  }

  async resolveIncident(userId: string, incidentId: string, dto: any) {
    const incident = await this.ensureIncidentParticipant(userId, incidentId);
    const updated = await this.prisma.bookingIncident.update({
      where: { id: incidentId },
      data: {
        status: dto.status || 'RESOLVED',
        resolutionNote: dto.resolutionNote,
        resolvedAt: ['RESOLVED', 'CANCELLED'].includes(dto.status || 'RESOLVED')
          ? new Date()
          : undefined,
      },
      include: this.incidentInclude(),
    });
    await this.audit(
      userId,
      'INCIDENT_RESOLVED',
      'BookingIncident',
      incidentId,
      incident,
      updated,
    );
    return updated;
  }

  async escalateIncidentToDispute(
    userId: string,
    incidentId: string,
    dto: any,
  ) {
    const incident = await this.ensureIncidentParticipant(userId, incidentId);
    const dispute = await this.openDispute(userId, incident.bookingId, {
      reason: dto.reason || incident.title,
      details: dto.details || incident.description,
      evidenceUrls: dto.evidenceUrls,
    });
    await this.prisma.bookingIncident.update({
      where: { id: incidentId },
      data: {
        status: 'ESCALATED',
        escalatedDisputeId: dispute.id,
      },
    });
    await this.audit(
      userId,
      'INCIDENT_ESCALATED_TO_DISPUTE',
      'BookingIncident',
      incidentId,
      incident,
      dispute,
    );
    return dispute;
  }

  async refreshTrustSignals(vendorId: string) {
    const trust = await this.vendorTrustWithoutSignals(vendorId);
    await this.prisma.vendorTrustSignal.deleteMany({ where: { vendorId } });
    await this.prisma.vendorTrustSignal.createMany({
      data: [
        {
          vendorId,
          type: 'REVIEW_SCORE',
          label: 'Average customer rating',
          score:
            trust.averageRating === null
              ? 0
              : Math.round((trust.averageRating / 5) * 100),
          weight: 3,
          source: 'reviews',
        },
        {
          vendorId,
          type: 'COMPLETED_BOOKINGS',
          label: 'Completed platform bookings',
          score: Math.min(trust.completedBookings * 20, 100),
          weight: 2,
          source: 'bookings',
        },
        {
          vendorId,
          type: 'VERIFICATION',
          label: 'Verification level',
          score: this.verificationScore(trust.verificationLevel) * 5,
          weight: 2,
          source: 'vendor_profile',
        },
        {
          vendorId,
          type: 'DISPUTE_RATE',
          label: 'Open dispute health',
          score: Math.max(0, 100 - trust.openDisputes * 25),
          weight: 2,
          source: 'disputes',
        },
      ],
    });
  }

  private async vendorTrustWithoutSignals(vendorId: string) {
    const vendor = await this.ensureVendor(vendorId);
    const [reviews, completedBookings, openDisputes] = await Promise.all([
      this.prisma.vendorReview.findMany({
        where: { vendorId, status: 'PUBLISHED' },
      }),
      this.prisma.booking.count({ where: { vendorId, status: 'COMPLETED' } }),
      this.prisma.bookingDispute.count({
        where: { vendorId, status: { in: ['OPEN', 'UNDER_REVIEW'] } },
      }),
    ]);

    return {
      averageRating: this.average(reviews.map((review) => review.rating)),
      completedBookings,
      openDisputes,
      verificationLevel: vendor.verificationLevel,
    };
  }

  private async ensureVendor(vendorId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }
    return vendor;
  }

  private reviewData(dto: any, rating: number) {
    return {
      rating,
      communicationRating:
        dto.communicationRating === undefined
          ? undefined
          : this.rating(dto.communicationRating),
      qualityRating:
        dto.qualityRating === undefined
          ? undefined
          : this.rating(dto.qualityRating),
      valueRating:
        dto.valueRating === undefined
          ? undefined
          : this.rating(dto.valueRating),
      professionalismRating:
        dto.professionalismRating === undefined
          ? undefined
          : this.rating(dto.professionalismRating),
      title: dto.title,
      comment: dto.comment,
      wouldRecommend: dto.wouldRecommend ?? true,
      tags: this.toStringArray(dto.tags),
      visibility: dto.visibility || 'PUBLIC',
      status: 'PUBLISHED' as const,
    };
  }

  private reviewInclude() {
    return {
      vendor: true,
      booking: { include: { serviceRequest: { include: { category: true } } } },
      customer: { select: { id: true, fullName: true, email: true } },
    };
  }

  private disputeInclude() {
    return {
      booking: true,
      vendor: true,
      openedBy: { select: { id: true, fullName: true, email: true } },
      evidence: true,
    };
  }

  private incidentInclude() {
    return {
      booking: true,
      vendor: true,
      openedBy: { select: { id: true, fullName: true, email: true } },
      evidence: true,
    };
  }

  private async ensureDisputeParticipant(userId: string, disputeId: string) {
    const dispute = await this.prisma.bookingDispute.findFirst({
      where: {
        id: disputeId,
        OR: [{ customerId: userId }, { vendor: { userId } }],
      },
    });
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }
    return dispute;
  }

  private async ensureIncidentParticipant(userId: string, incidentId: string) {
    const incident = await this.prisma.bookingIncident.findFirst({
      where: {
        id: incidentId,
        OR: [{ customerId: userId }, { vendor: { userId } }],
      },
    });
    if (!incident) {
      throw new NotFoundException('Incident not found');
    }
    return incident;
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

  private average(values: number[]) {
    if (!values.length) return null;
    return (
      Math.round(
        (values.reduce((sum, value) => sum + value, 0) / values.length) * 10,
      ) / 10
    );
  }

  private rating(value: unknown) {
    const rating = Number(value);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be an integer from 1 to 5');
    }
    return rating;
  }

  private toStringArray(value: unknown) {
    if (Array.isArray(value)) return value.map(String).filter(Boolean);
    if (typeof value === 'string')
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    return [];
  }
}
