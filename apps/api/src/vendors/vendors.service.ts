import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService) {}

  async listVendors(query: any = {}) {
    const where = this.marketplaceWhere(query);
    const orderBy = this.marketplaceOrder(query.sort);

    const vendors = await this.prisma.vendor.findMany({
      where,
      orderBy,
      include: {
        user: { select: { fullName: true, city: true } },
        services: {
          where: { isActive: true },
          include: { category: true },
          take: 3,
        },
        portfolio: {
          where: { isFeatured: true },
          orderBy: { sortOrder: 'asc' },
          take: 3,
        },
        packages: { where: { isActive: true }, take: 3 },
        availability: query.date
          ? {
              where: this.availabilityWhere(query),
              take: 3,
              orderBy: { date: 'asc' },
            }
          : { take: 3, orderBy: { date: 'asc' } },
        reviews: {
          where: { status: 'PUBLISHED', visibility: 'PUBLIC' },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        bookings: { where: { status: 'COMPLETED' }, select: { id: true } },
        disputes: {
          where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } },
          select: { id: true },
        },
        trustSignals: { orderBy: { generatedAt: 'desc' }, take: 5 },
      },
    });

    return vendors
      .map((vendor) => ({
        ...vendor,
        trustFactors: this.trustFactors(vendor),
      }))
      .filter((vendor) => {
        const minRating = this.toNumber(query.minRating);
        if (!minRating) {
          return true;
        }

        return Number(vendor.trustFactors.averageRating || 0) >= minRating;
      });
  }

  async listCategories() {
    const categories = await this.prisma.serviceCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { services: true },
        },
      },
    });

    return categories.map((category) => ({
      ...category,
      vendorCount: category._count.services,
    }));
  }

  async getCategory(slug: string, query: any = {}) {
    const category = await this.prisma.serviceCategory.findUnique({
      where: { slug },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const vendors = await this.listVendors({ ...query, category: slug });
    return { category, vendors };
  }

  async getVendor(vendorId: string) {
    const vendor = await this.prisma.vendor.findFirst({
      where: {
        id: vendorId,
        isActive: true,
        verificationStatus: { not: 'SUSPENDED' },
      },
      include: {
        user: {
          select: {
            fullName: true,
            city: true,
            email: true,
            profile: { select: { avatarUrl: true } },
          },
        },
        verifications: { orderBy: { createdAt: 'desc' } },
        portfolio: { orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }] },
        services: {
          where: { isActive: true },
          include: { category: true, packages: { where: { isActive: true } } },
        },
        packages: { where: { isActive: true } },
        teams: { where: { isActive: true } },
        availability: { orderBy: { date: 'asc' }, take: 20 },
        inquiries: { orderBy: { createdAt: 'desc' }, take: 5 },
        reviews: {
          where: { status: 'PUBLISHED', visibility: 'PUBLIC' },
          include: { customer: { select: { fullName: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        bookings: { where: { status: 'COMPLETED' }, select: { id: true } },
        disputes: {
          where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } },
          select: { id: true },
        },
        trustSignals: { orderBy: { generatedAt: 'desc' }, take: 10 },
      },
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return {
      ...vendor,
      logoUrl: vendor.user?.profile?.avatarUrl,
      trustFactors: this.trustFactors(vendor),
    };
  }

  async getMyVendor(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            fullName: true,
            city: true,
            email: true,
            profile: { select: { avatarUrl: true } },
          },
        },
        verifications: { orderBy: { createdAt: 'desc' } },
        portfolio: { orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }] },
        services: {
          include: { category: true, packages: true },
          orderBy: { createdAt: 'desc' },
        },
        packages: { orderBy: { createdAt: 'desc' } },
        teams: { orderBy: { createdAt: 'asc' } },
        availability: { orderBy: { date: 'asc' }, take: 30 },
        inquiries: { orderBy: { createdAt: 'desc' }, take: 20 },
        reviews: { orderBy: { createdAt: 'desc' }, take: 20 },
        bookings: { where: { status: 'COMPLETED' }, select: { id: true } },
        disputes: {
          where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } },
          select: { id: true },
        },
        trustSignals: { orderBy: { generatedAt: 'desc' }, take: 10 },
      },
    });
    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    return { ...vendor, logoUrl: vendor.user?.profile?.avatarUrl };
  }

  async getMyDashboard(userId: string) {
    const vendor = await this.getMyVendor(userId);
    const pendingVerification = vendor.verifications.filter(
      (item) => item.status === 'PENDING',
    ).length;
    const activeServices = vendor.services.filter(
      (item) => item.isActive,
    ).length;
    const activePackages = vendor.packages.filter(
      (item) => item.isActive,
    ).length;
    const upcomingAvailability = vendor.availability
      .filter((item) => item.date >= new Date())
      .slice(0, 5);
    const newInquiries = vendor.inquiries.filter(
      (item) => item.status === 'NEW',
    ).length;
    const trustFactors = this.trustFactors(vendor);

    return {
      vendor,
      metrics: {
        verificationStatus: vendor.verificationStatus,
        verificationLevel: vendor.verificationLevel,
        pendingVerification,
        activeServices,
        activePackages,
        teams: vendor.teams.filter((team) => team.isActive).length,
        portfolioItems: vendor.portfolio.length,
        upcomingAvailability: upcomingAvailability.length,
        newInquiries,
        averageRating: trustFactors.averageRating,
        reviewCount: trustFactors.reviewCount,
        completedBookings: trustFactors.completedBookings,
        openDisputes: trustFactors.openDisputes,
        trustScore: trustFactors.trustScore,
      },
      upcomingAvailability,
      trustFactors,
    };
  }

  async getMyInquiries(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    return this.prisma.vendorInquiry.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateInquiry(userId: string, inquiryId: string, dto: any) {
    const inquiry = await this.prisma.vendorInquiry.findFirst({
      where: { id: inquiryId, vendor: { userId } },
    });
    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    return this.prisma.vendorInquiry.update({
      where: { id: inquiryId },
      data: {
        status: dto.status,
      },
    });
  }

  async createInquiry(vendorId: string, dto: any) {
    const vendor = await this.prisma.vendor.findFirst({
      where: {
        id: vendorId,
        isActive: true,
        verificationStatus: { not: 'SUSPENDED' },
      },
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }
    if (!dto.name || !dto.email || !dto.message) {
      throw new BadRequestException('Name, email, and message are required');
    }

    return this.prisma.vendorInquiry.create({
      data: {
        vendorId,
        weddingId: dto.weddingId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        city: dto.city,
        eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
        guestCount: this.toNumber(dto.guestCount),
        message: dto.message,
      },
    });
  }

  async createOrUpdateVendor(userId: string, dto: any) {
    await this.prisma.vendor.upsert({
      where: { userId },
      create: {
        userId,
        businessName: dto.businessName,
        ownerName: dto.ownerName,
        description: dto.description,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        city: dto.city,
        serviceAreas: this.toStringArray(dto.serviceAreas),
        yearsOfExperience: this.toNumber(dto.yearsOfExperience),
        teamSize: this.toNumber(dto.teamSize),
        startingPrice: this.toNumber(dto.startingPrice),
      },
      update: this.vendorData(dto),
    });

    if (dto.logoUrl) {
      await this.upsertVendorLogo(userId, dto.logoUrl);
    }

    return this.getMyVendor(userId);
  }

  async updateVendor(userId: string, vendorId: string, dto: any) {
    await this.ensureVendorOwner(userId, vendorId);
    const vendor = await this.prisma.vendor.update({
      where: { id: vendorId },
      data: this.vendorData(dto),
    });
    if (dto.logoUrl) {
      await this.upsertVendorLogo(userId, dto.logoUrl);
    }

    return vendor;
  }

  async submitVerification(userId: string, vendorId: string, dto: any) {
    await this.ensureVendorOwner(userId, vendorId);
    const verification = await this.prisma.vendorVerification.create({
      data: {
        vendorId,
        documentType: dto.documentType || 'OTHER',
        documentUrl: dto.documentUrl,
        notes: dto.notes,
        status: 'PENDING',
      },
    });

    await this.prisma.vendor.update({
      where: { id: vendorId },
      data: { verificationStatus: 'PENDING' },
    });

    return verification;
  }

  async addPortfolioItem(userId: string, vendorId: string, dto: any) {
    await this.ensureVendorOwner(userId, vendorId);
    return this.prisma.vendorPortfolio.create({
      data: {
        vendorId,
        title: dto.title,
        imageUrl: dto.imageUrl,
        description: dto.description,
        isFeatured: dto.isFeatured ?? false,
        sortOrder: this.toNumber(dto.sortOrder) || 0,
      },
    });
  }

  async deletePortfolioItem(userId: string, portfolioId: string) {
    const item = await this.prisma.vendorPortfolio.findFirst({
      where: { id: portfolioId, vendor: { userId } },
    });
    if (!item) {
      throw new NotFoundException('Portfolio item not found');
    }

    await this.prisma.vendorPortfolio.delete({ where: { id: portfolioId } });
    return { id: portfolioId, deleted: true };
  }

  async addTeam(userId: string, vendorId: string, dto: any) {
    await this.ensureVendorOwner(userId, vendorId);
    return this.prisma.vendorTeam.create({
      data: {
        vendorId,
        name: dto.name,
        description: dto.description,
        capacity: this.toNumber(dto.capacity) || 1,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateTeam(userId: string, teamId: string, dto: any) {
    const team = await this.prisma.vendorTeam.findFirst({
      where: { id: teamId, vendor: { userId } },
    });
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return this.prisma.vendorTeam.update({
      where: { id: teamId },
      data: {
        name: dto.name,
        description: dto.description,
        capacity: this.toNumber(dto.capacity),
        isActive: dto.isActive,
      },
    });
  }

  async addService(userId: string, vendorId: string, dto: any) {
    await this.ensureVendorOwner(userId, vendorId);
    const category = await this.findCategory(dto.categoryId, dto.categorySlug);

    return this.prisma.serviceListing.create({
      data: {
        vendorId,
        categoryId: category?.id,
        title: dto.title,
        description: dto.description,
        pricingModel: dto.pricingModel || 'STARTING_FROM',
        startingPrice: this.toNumber(dto.startingPrice),
        serviceAreas: this.toStringArray(dto.serviceAreas),
        capacity: this.toNumber(dto.capacity),
        inclusions: this.toStringArray(dto.inclusions),
        exclusions: this.toStringArray(dto.exclusions),
        addOns: this.toStringArray(dto.addOns),
        leadTimeDays: this.toNumber(dto.leadTimeDays),
        cancellationPolicy: dto.cancellationPolicy,
        isActive: dto.isActive ?? true,
      },
      include: { category: true },
    });
  }

  async listServices(vendorId: string) {
    return this.prisma.serviceListing.findMany({
      where: { vendorId, isActive: true },
      include: { category: true, packages: { where: { isActive: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateService(userId: string, serviceId: string, dto: any) {
    const service = await this.prisma.serviceListing.findFirst({
      where: { id: serviceId, vendor: { userId } },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const category = await this.findCategory(dto.categoryId, dto.categorySlug);
    return this.prisma.serviceListing.update({
      where: { id: serviceId },
      data: {
        categoryId: category?.id,
        title: dto.title,
        description: dto.description,
        pricingModel: dto.pricingModel,
        startingPrice: this.toNumber(dto.startingPrice),
        serviceAreas:
          Array.isArray(dto.serviceAreas) ||
          typeof dto.serviceAreas === 'string'
            ? this.toStringArray(dto.serviceAreas)
            : undefined,
        capacity: this.toNumber(dto.capacity),
        inclusions:
          Array.isArray(dto.inclusions) || typeof dto.inclusions === 'string'
            ? this.toStringArray(dto.inclusions)
            : undefined,
        exclusions:
          Array.isArray(dto.exclusions) || typeof dto.exclusions === 'string'
            ? this.toStringArray(dto.exclusions)
            : undefined,
        addOns:
          Array.isArray(dto.addOns) || typeof dto.addOns === 'string'
            ? this.toStringArray(dto.addOns)
            : undefined,
        leadTimeDays: this.toNumber(dto.leadTimeDays),
        cancellationPolicy: dto.cancellationPolicy,
        isActive: dto.isActive,
      },
      include: { category: true, packages: true },
    });
  }

  async deleteService(userId: string, serviceId: string) {
    const service = await this.prisma.serviceListing.findFirst({
      where: { id: serviceId, vendor: { userId } },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return this.prisma.serviceListing.update({
      where: { id: serviceId },
      data: { isActive: false },
    });
  }

  async addPackage(userId: string, serviceId: string, dto: any) {
    const service = await this.prisma.serviceListing.findFirst({
      where: { id: serviceId, vendor: { userId } },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return this.prisma.servicePackage.create({
      data: {
        vendorId: service.vendorId,
        serviceId,
        ...this.packageData(dto),
      } as any,
    });
  }

  async updatePackage(userId: string, packageId: string, dto: any) {
    const item = await this.prisma.servicePackage.findFirst({
      where: { id: packageId, vendor: { userId } },
    });
    if (!item) {
      throw new NotFoundException('Package not found');
    }

    return this.prisma.servicePackage.update({
      where: { id: packageId },
      data: this.packageData(dto) as any,
    });
  }

  async addAvailability(userId: string, vendorId: string, dto: any) {
    await this.ensureVendorOwner(userId, vendorId);
    await this.ensureAvailabilitySlot(vendorId, dto);

    return this.prisma.vendorAvailability.create({
      data: {
        vendorId,
        teamId: dto.teamId,
        date: new Date(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime,
        capacity: this.toNumber(dto.capacity) || 1,
        status: dto.status || 'AVAILABLE',
        notes: dto.notes,
      },
      include: { team: true },
    });
  }

  async listAvailability(vendorId: string) {
    return this.prisma.vendorAvailability.findMany({
      where: { vendorId },
      include: { team: true },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  async updateAvailability(userId: string, availabilityId: string, dto: any) {
    const item = await this.prisma.vendorAvailability.findFirst({
      where: { id: availabilityId, vendor: { userId } },
    });
    if (!item) {
      throw new NotFoundException('Availability not found');
    }

    await this.ensureAvailabilitySlot(item.vendorId, dto, availabilityId);
    return this.prisma.vendorAvailability.update({
      where: { id: availabilityId },
      data: {
        teamId: dto.teamId,
        date: dto.date ? new Date(dto.date) : undefined,
        startTime: dto.startTime,
        endTime: dto.endTime,
        capacity: this.toNumber(dto.capacity),
        status: dto.status,
        notes: dto.notes,
      },
      include: { team: true },
    });
  }

  async deleteAvailability(userId: string, availabilityId: string) {
    const item = await this.prisma.vendorAvailability.findFirst({
      where: { id: availabilityId, vendor: { userId } },
    });
    if (!item) {
      throw new NotFoundException('Availability not found');
    }

    await this.prisma.vendorAvailability.delete({
      where: { id: availabilityId },
    });
    return { id: availabilityId, deleted: true };
  }

  private async ensureVendorOwner(userId: string, vendorId: string) {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, userId },
    });
    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    return vendor;
  }

  private async findCategory(categoryId?: string, categorySlug?: string) {
    if (categoryId) {
      return this.prisma.serviceCategory.findUnique({
        where: { id: categoryId },
      });
    }
    if (categorySlug) {
      return this.prisma.serviceCategory.findUnique({
        where: { slug: categorySlug },
      });
    }
    return null;
  }

  private async ensureAvailabilitySlot(
    vendorId: string,
    dto: any,
    excludeId?: string,
  ) {
    if (
      !dto.date ||
      !dto.teamId ||
      !['AVAILABLE', 'PARTIALLY_AVAILABLE', undefined].includes(dto.status)
    ) {
      return;
    }

    const existing = await this.prisma.vendorAvailability.findFirst({
      where: {
        vendorId,
        teamId: dto.teamId,
        date: new Date(dto.date),
        status: { in: ['BOOKED', 'TENTATIVELY_RESERVED'] },
        id: excludeId ? { not: excludeId } : undefined,
      },
    });
    if (existing) {
      throw new BadRequestException(
        'Team already has a conflicting reservation for this date',
      );
    }
  }

  private marketplaceWhere(query: any) {
    const where: any = {
      isActive: true,
      verificationStatus: { not: 'SUSPENDED' },
    };
    const and: any[] = [];

    if (query.q) {
      and.push({
        OR: [
          { businessName: { contains: query.q, mode: 'insensitive' } },
          { description: { contains: query.q, mode: 'insensitive' } },
          { ownerName: { contains: query.q, mode: 'insensitive' } },
          {
            services: {
              some: {
                isActive: true,
                OR: [
                  { title: { contains: query.q, mode: 'insensitive' } },
                  { description: { contains: query.q, mode: 'insensitive' } },
                  {
                    category: {
                      name: { contains: query.q, mode: 'insensitive' },
                    },
                  },
                ],
              },
            },
          },
        ],
      });
    }

    if (query.city) {
      and.push({
        OR: [
          { city: { contains: query.city, mode: 'insensitive' } },
          { serviceAreas: { has: query.city } },
          {
            services: {
              some: { isActive: true, serviceAreas: { has: query.city } },
            },
          },
        ],
      });
    }

    if (query.category) {
      and.push({
        services: {
          some: {
            isActive: true,
            category: { slug: query.category },
          },
        },
      });
    }

    if (query.categoryId) {
      and.push({
        services: { some: { isActive: true, categoryId: query.categoryId } },
      });
    }

    if (query.verificationLevel) {
      where.verificationLevel = query.verificationLevel;
    }

    if (query.verificationStatus) {
      where.verificationStatus = query.verificationStatus;
    }

    if (query.minPrice || query.maxPrice) {
      where.startingPrice = {
        gte: this.toNumber(query.minPrice),
        lte: this.toNumber(query.maxPrice),
      };
    }

    if (query.capacity) {
      and.push({
        services: {
          some: {
            isActive: true,
            capacity: { gte: this.toNumber(query.capacity) },
          },
        },
      });
    }

    if (query.date || query.availability) {
      and.push({ availability: { some: this.availabilityWhere(query) } });
    }

    if (and.length) {
      where.AND = and;
    }

    return where;
  }

  private availabilityWhere(query: any) {
    const where: any = {};

    if (query.date) {
      const start = new Date(query.date);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      where.date = { gte: start, lt: end };
    }

    if (query.availability) {
      where.status = query.availability;
    } else if (query.date) {
      where.status = { in: ['AVAILABLE', 'PARTIALLY_AVAILABLE'] };
    }

    return where;
  }

  private marketplaceOrder(sort?: string) {
    switch (sort) {
      case 'price_asc':
        return { startingPrice: 'asc' as const };
      case 'price_desc':
        return { startingPrice: 'desc' as const };
      case 'oldest':
        return { createdAt: 'asc' as const };
      default:
        return { createdAt: 'desc' as const };
    }
  }

  private trustFactors(vendor: any) {
    const reviews = vendor.reviews || [];
    const completedBookings = vendor.bookings?.length || 0;
    const openDisputes = vendor.disputes?.length || 0;
    const averageRating = reviews.length
      ? Math.round(
          (reviews.reduce(
            (sum: number, review: any) => sum + Number(review.rating || 0),
            0,
          ) /
            reviews.length) *
            10,
        ) / 10
      : null;
    const recommendationRate = reviews.length
      ? Math.round(
          (reviews.filter((review: any) => review.wouldRecommend).length /
            reviews.length) *
            100,
        )
      : null;
    const responseRate = vendor.inquiries?.length
      ? 'Tracked after inquiry responses'
      : 'No inquiries yet';
    const availabilityRecords = vendor.availability?.length || 0;
    const reviewScore =
      averageRating === null ? 0 : Math.round((averageRating / 5) * 60);
    const completionScore = Math.min(completedBookings * 8, 20);
    const verificationScore = this.verificationTrustScore(
      vendor.verificationLevel,
    );
    const trustScore = Math.max(
      0,
      Math.min(
        100,
        reviewScore +
          completionScore +
          verificationScore -
          Math.min(openDisputes * 10, 30),
      ),
    );

    return {
      verificationLevel: vendor.verificationLevel,
      verificationStatus: vendor.verificationStatus,
      completedBookings,
      openDisputes,
      averageRating,
      reviewCount: reviews.length,
      recommendationRate,
      trustScore,
      trustSignals: vendor.trustSignals || [],
      responseRate,
      availabilityRecords,
      portfolioItems: vendor.portfolio?.length || 0,
      serviceCount: vendor.services?.length || 0,
    };
  }

  private verificationTrustScore(level?: string) {
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

  private vendorData(dto: any) {
    return {
      businessName: dto.businessName,
      ownerName: dto.ownerName,
      description: dto.description,
      phone: dto.phone,
      email: dto.email,
      address: dto.address,
      city: dto.city,
      serviceAreas:
        Array.isArray(dto.serviceAreas) || typeof dto.serviceAreas === 'string'
          ? this.toStringArray(dto.serviceAreas)
          : undefined,
      yearsOfExperience: this.toNumber(dto.yearsOfExperience),
      teamSize: this.toNumber(dto.teamSize),
      startingPrice: this.toNumber(dto.startingPrice),
      isActive: dto.isActive,
    };
  }

  private async upsertVendorLogo(userId: string, logoUrl: string) {
    return this.prisma.userProfile.upsert({
      where: { userId },
      create: { userId, avatarUrl: logoUrl },
      update: { avatarUrl: logoUrl },
    });
  }

  private packageData(dto: any) {
    return {
      name: dto.name,
      description: dto.description,
      price: this.toNumber(dto.price),
      includedItems:
        Array.isArray(dto.includedItems) ||
        typeof dto.includedItems === 'string'
          ? this.toStringArray(dto.includedItems)
          : undefined,
      excludedItems:
        Array.isArray(dto.excludedItems) ||
        typeof dto.excludedItems === 'string'
          ? this.toStringArray(dto.excludedItems)
          : undefined,
      addOns:
        Array.isArray(dto.addOns) || typeof dto.addOns === 'string'
          ? this.toStringArray(dto.addOns)
          : undefined,
      eventCoverage: dto.eventCoverage,
      teamSize: this.toNumber(dto.teamSize),
      deliveryTimeline: dto.deliveryTimeline,
      isActive: dto.isActive,
    };
  }

  private toStringArray(value: unknown) {
    if (Array.isArray(value)) {
      return value.map(String).filter(Boolean);
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  }

  private toNumber(value: unknown) {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    return Number(value);
  }
}
