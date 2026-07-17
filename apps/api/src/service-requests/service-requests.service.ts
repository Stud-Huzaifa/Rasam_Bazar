import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ServiceRequestsService {
  constructor(private prisma: PrismaService) {}

  async createRequest(userId: string, dto: any) {
    await this.ensureWedding(userId, dto.weddingId);
    const category = await this.findCategory(dto.categoryId, dto.categorySlug);

    return this.prisma.serviceRequest.create({
      data: {
        customerId: userId,
        weddingId: dto.weddingId,
        eventId: dto.eventId || undefined,
        categoryId: category?.id,
        title: dto.title,
        city: dto.city,
        venue: dto.venue,
        eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
        startTime: dto.startTime,
        guestCount: this.toNumber(dto.guestCount),
        minBudget: this.toNumber(dto.minBudget),
        maxBudget: this.toNumber(dto.maxBudget),
        description: dto.description,
        deliverables: this.toStringArray(dto.deliverables),
        attachments: this.toStringArray(dto.attachments),
        proposalDeadline: dto.proposalDeadline
          ? new Date(dto.proposalDeadline)
          : undefined,
        visibility: dto.visibility || 'PUBLIC_TO_MATCHING_VENDORS',
        status: dto.status || 'DRAFT',
      },
      include: this.requestInclude(),
    });
  }

  async listRequests(userId: string) {
    return this.prisma.serviceRequest.findMany({
      where: { customerId: userId },
      include: this.requestInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRequest(userId: string, requestId: string) {
    const request = await this.prisma.serviceRequest.findFirst({
      where: { id: requestId, customerId: userId },
      include: this.requestInclude(true),
    });
    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    return request;
  }

  async updateRequest(userId: string, requestId: string, dto: any) {
    await this.ensureRequest(userId, requestId);
    const category = await this.findCategory(dto.categoryId, dto.categorySlug);

    return this.prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        eventId: dto.eventId,
        categoryId: category?.id,
        title: dto.title,
        city: dto.city,
        venue: dto.venue,
        eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
        startTime: dto.startTime,
        guestCount: this.toNumber(dto.guestCount),
        minBudget: this.toNumber(dto.minBudget),
        maxBudget: this.toNumber(dto.maxBudget),
        description: dto.description,
        deliverables:
          Array.isArray(dto.deliverables) ||
          typeof dto.deliverables === 'string'
            ? this.toStringArray(dto.deliverables)
            : undefined,
        attachments:
          Array.isArray(dto.attachments) || typeof dto.attachments === 'string'
            ? this.toStringArray(dto.attachments)
            : undefined,
        proposalDeadline: dto.proposalDeadline
          ? new Date(dto.proposalDeadline)
          : undefined,
        visibility: dto.visibility,
        status: dto.status,
      },
      include: this.requestInclude(true),
    });
  }

  async publishRequest(userId: string, requestId: string) {
    await this.ensureRequest(userId, requestId);
    const request = await this.prisma.serviceRequest.update({
      where: { id: requestId },
      data: { status: 'PUBLISHED' },
      include: this.requestInclude(true),
    });
    await this.recalculateMatches(request.id);
    return this.getRequest(userId, requestId);
  }

  async inviteVendor(
    userId: string,
    requestId: string,
    vendorId: string,
    note?: string,
  ) {
    await this.ensureRequest(userId, requestId);
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return this.prisma.serviceRequestInvitation.upsert({
      where: {
        serviceRequestId_vendorId: { serviceRequestId: requestId, vendorId },
      },
      create: { serviceRequestId: requestId, vendorId, note },
      update: { status: 'INVITED', note },
      include: { vendor: true },
    });
  }

  async closeRequest(userId: string, requestId: string) {
    await this.ensureRequest(userId, requestId);
    return this.prisma.serviceRequest.update({
      where: { id: requestId },
      data: { status: 'CLOSED' },
      include: this.requestInclude(true),
    });
  }

  async matchingVendors(userId: string, requestId: string) {
    await this.ensureRequest(userId, requestId);
    await this.recalculateMatches(requestId);
    return this.prisma.serviceRequestMatch.findMany({
      where: { serviceRequestId: requestId },
      include: {
        vendor: {
          include: {
            services: { include: { category: true } },
            availability: true,
            portfolio: { take: 1 },
          },
        },
      },
      orderBy: { score: 'desc' },
    });
  }

  async matchingRequestsForVendor(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
      include: this.vendorMatchInclude(),
    });
    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    const requests = await this.prisma.serviceRequest.findMany({
      where: {
        status: { in: ['PUBLISHED', 'RECEIVING_PROPOSALS'] },
        visibility: 'PUBLIC_TO_MATCHING_VENDORS',
      },
      include: this.requestInclude(true),
      orderBy: { createdAt: 'desc' },
    });

    return requests
      .map((request) => ({
        request,
        match: this.scoreVendor(vendor as any, request as any),
      }))
      .filter((item) => item.match.score > 0)
      .sort((a, b) => b.match.score - a.match.score);
  }

  private async recalculateMatches(requestId: string) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: { category: true },
    });
    if (!request) return;

    const vendors = await this.prisma.vendor.findMany({
      where: {
        isActive: true,
        verificationStatus: { not: 'SUSPENDED' },
      },
      include: this.vendorMatchInclude(),
    });
    const matchedVendorIds: string[] = [];

    for (const vendor of vendors) {
      const match = this.scoreVendor(vendor as any, request as any);
      if (match.score <= 0) continue;
      matchedVendorIds.push(vendor.id);

      await this.prisma.serviceRequestMatch.upsert({
        where: {
          serviceRequestId_vendorId: {
            serviceRequestId: requestId,
            vendorId: vendor.id,
          },
        },
        create: {
          serviceRequestId: requestId,
          vendorId: vendor.id,
          score: match.score,
          reasons: match.reasons,
        },
        update: { score: match.score, reasons: match.reasons },
      });
    }

    await this.prisma.serviceRequestMatch.deleteMany({
      where: {
        serviceRequestId: requestId,
        ...(matchedVendorIds.length
          ? { vendorId: { notIn: matchedVendorIds } }
          : {}),
      },
    });
  }

  private scoreVendor(vendor: any, request: any) {
    let score = 0;
    const reasons: string[] = [];
    const vendorServices = (vendor.services || []).filter(
      (service: any) => service.isActive !== false,
    );
    const categoryMatch =
      request.categoryId &&
      vendorServices.some(
        (service: any) => service.categoryId === request.categoryId,
      );
    if (categoryMatch) {
      score += 25;
      reasons.push('Category match');
    } else if (request.categoryId) {
      return { score: 0, reasons: ['Category mismatch'] };
    }

    const locationMatch =
      request.city &&
      (vendor.city?.toLowerCase() === request.city.toLowerCase() ||
        vendor.serviceAreas?.some(
          (area: string) => area.toLowerCase() === request.city.toLowerCase(),
        ) ||
        vendorServices.some((service: any) =>
          service.serviceAreas?.some(
            (area: string) => area.toLowerCase() === request.city.toLowerCase(),
          ),
        ));
    if (locationMatch) {
      score += 15;
      reasons.push('Location match');
    }

    const availabilityMatch =
      request.eventDate &&
      vendor.availability?.some(
        (slot: any) =>
          this.sameDate(slot.date, request.eventDate) &&
          ['AVAILABLE', 'PARTIALLY_AVAILABLE'].includes(slot.status),
      );
    if (availabilityMatch) {
      score += 20;
      reasons.push('Available on event date');
    }

    const maxBudget = Number(request.maxBudget || 0);
    const vendorPrices = [
      vendor.startingPrice,
      ...vendorServices.map((service: any) => service.startingPrice),
      ...(vendor.packages || []).map((item: any) => item.price),
    ]
      .map((value) => Number(value || 0))
      .filter((value) => value > 0);
    if (maxBudget && vendorPrices.some((price) => price <= maxBudget)) {
      score += 15;
      reasons.push('Budget compatible');
    }

    if (
      vendor.verificationStatus === 'APPROVED' ||
      (vendor.verificationLevel && vendor.verificationLevel !== 'UNVERIFIED')
    ) {
      score += 5;
      reasons.push('Verified vendor profile');
    }

    const capacityMatch =
      vendorServices.some(
        (service: any) =>
          !request.guestCount ||
          !service.capacity ||
          service.capacity >= request.guestCount,
      ) ||
      (vendor.teams || []).some(
        (team: any) =>
          team.isActive !== false &&
          (!request.guestCount || team.capacity >= request.guestCount),
      ) ||
      (vendor.availability || []).some(
        (slot: any) =>
          ['AVAILABLE', 'PARTIALLY_AVAILABLE'].includes(slot.status) &&
          (!request.guestCount || slot.capacity >= request.guestCount),
      );
    if (capacityMatch) {
      score += 10;
      reasons.push('Capacity compatible');
    }

    const ratings = (vendor.reviews || [])
      .filter(
        (review: any) =>
          review.status === undefined || review.status === 'PUBLISHED',
      )
      .map((review: any) => Number(review.rating || 0))
      .filter((rating: number) => rating > 0);
    if (ratings.length) {
      const averageRating =
        ratings.reduce((sum: number, rating: number) => sum + rating, 0) /
        ratings.length;
      const ratingScore =
        averageRating >= 4.5
          ? 10
          : averageRating >= 4
            ? 8
            : averageRating >= 3.5
              ? 5
              : 2;
      score += ratingScore;
      reasons.push(`Rating ${averageRating.toFixed(1)}`);
    }

    return { score: Math.min(score, 100), reasons };
  }

  private async ensureWedding(userId: string, weddingId: string) {
    const wedding = await this.prisma.wedding.findFirst({
      where: { id: weddingId, ownerId: userId },
    });
    if (!wedding) {
      throw new NotFoundException('Wedding not found');
    }
    return wedding;
  }

  private async ensureRequest(userId: string, requestId: string) {
    const request = await this.prisma.serviceRequest.findFirst({
      where: { id: requestId, customerId: userId },
    });
    if (!request) {
      throw new NotFoundException('Service request not found');
    }
    return request;
  }

  private async findCategory(categoryId?: string, categorySlug?: string) {
    if (categoryId)
      return this.prisma.serviceCategory.findUnique({
        where: { id: categoryId },
      });
    if (categorySlug)
      return this.prisma.serviceCategory.findUnique({
        where: { slug: categorySlug },
      });
    return null;
  }

  private requestInclude(full = false) {
    return {
      wedding: true,
      event: true,
      category: true,
      invitations: full
        ? { include: { vendor: true }, orderBy: { createdAt: 'desc' as const } }
        : true,
      matches: full
        ? { include: { vendor: true }, orderBy: { score: 'desc' as const } }
        : true,
    };
  }

  private vendorMatchInclude() {
    return {
      services: { include: { category: true } },
      packages: true,
      teams: true,
      availability: true,
      reviews: true,
      portfolio: { take: 1 },
    };
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

  private toNumber(value: unknown) {
    if (value === undefined || value === null || value === '') return undefined;
    return Number(value);
  }

  private sameDate(a: Date | string, b: Date | string) {
    return new Date(a).toDateString() === new Date(b).toDateString();
  }
}
