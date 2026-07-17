import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingsService } from '../bookings/bookings.service';
import { PrismaService } from '../prisma.service';

type ProposalWriteStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'VIEWED'
  | 'SHORTLISTED'
  | 'REVISION_REQUESTED'
  | 'REVISED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'WITHDRAWN';

@Injectable()
export class ProposalsService {
  constructor(
    private prisma: PrismaService,
    private bookingsService: BookingsService,
  ) {}

  async createProposal(userId: string, requestId: string, dto: any) {
    const vendor = await this.ensureVendor(userId);
    const request = await this.prisma.serviceRequest.findFirst({
      where: {
        id: requestId,
        status: { in: ['PUBLISHED', 'RECEIVING_PROPOSALS'] },
      },
    });
    if (!request) {
      throw new NotFoundException(
        'Service request not found or not accepting proposals',
      );
    }
    if (
      request.proposalDeadline &&
      new Date(request.proposalDeadline).getTime() < Date.now()
    ) {
      throw new BadRequestException('Proposal deadline has passed');
    }

    const existing = await this.prisma.proposal.findUnique({
      where: {
        serviceRequestId_vendorId: {
          serviceRequestId: requestId,
          vendorId: vendor.id,
        },
      },
      include: {
        versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
      },
    });
    if (
      existing &&
      ['ACCEPTED', 'REJECTED', 'EXPIRED'].includes(existing.status)
    ) {
      throw new BadRequestException('Finalized proposals cannot be replaced');
    }

    const proposal = existing
      ? await this.prisma.proposal.update({
          where: { id: existing.id },
          data: {
            status: this.nextProposalStatus(existing.status, dto),
            withdrawnAt: null,
          },
        })
      : await this.prisma.proposal.create({
          data: {
            serviceRequestId: requestId,
            vendorId: vendor.id,
            status: dto.submit === false ? 'DRAFT' : 'SUBMITTED',
          },
        });

    const latest = existing?.versions?.[0];
    const version = await this.createVersion(
      proposal.id,
      dto,
      latest ? latest.versionNumber + 1 : 1,
      latest?.id,
    );
    await this.prisma.proposal.update({
      where: { id: proposal.id },
      data: {
        latestVersionId: version.id,
        status: this.nextProposalStatus(
          existing?.status,
          dto,
          version.versionNumber,
        ),
      },
    });
    await this.prisma.serviceRequest.update({
      where: { id: requestId },
      data: { status: 'RECEIVING_PROPOSALS' },
    });
    await this.markInvitationResponded(requestId, vendor.id);

    return this.getProposal(userId, proposal.id);
  }

  async reviseProposal(userId: string, proposalId: string, dto: any) {
    const proposal = await this.ensureVendorProposal(userId, proposalId);
    if (
      ['ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED'].includes(proposal.status)
    ) {
      throw new BadRequestException('Finalized proposals cannot be revised');
    }

    await this.ensureProposalNotExpired(proposal);

    const latest = proposal.versions[0];
    const nextVersionNumber = latest ? latest.versionNumber + 1 : 1;
    const version = await this.createVersion(
      proposalId,
      dto,
      nextVersionNumber,
      latest?.id,
    );
    await this.prisma.proposal.update({
      where: { id: proposalId },
      data: {
        latestVersionId: version.id,
        status:
          dto.submit === false && proposal.status !== 'DRAFT'
            ? proposal.status
            : dto.submit === false
              ? 'DRAFT'
              : 'REVISED',
      },
    });

    return this.getProposal(userId, proposalId);
  }

  async listVendorProposals(userId: string) {
    const vendor = await this.ensureVendor(userId);
    const proposals = await this.prisma.proposal.findMany({
      where: { vendorId: vendor.id },
      include: this.proposalInclude(),
      orderBy: { updatedAt: 'desc' },
    });
    return this.expireProposalList(proposals);
  }

  async listCustomerProposals(userId: string) {
    const proposals = await this.prisma.proposal.findMany({
      where: { serviceRequest: { customerId: userId } },
      include: this.proposalInclude(),
      orderBy: { updatedAt: 'desc' },
    });
    return this.expireProposalList(proposals);
  }

  async listRequestProposals(userId: string, requestId: string) {
    await this.ensureCustomerRequest(userId, requestId);
    const proposals = await this.prisma.proposal.findMany({
      where: { serviceRequestId: requestId, status: { not: 'DRAFT' } },
      include: this.proposalInclude(),
      orderBy: { updatedAt: 'desc' },
    });
    return this.expireProposalList(proposals);
  }

  async compareProposals(userId: string, requestId: string) {
    const request = await this.ensureCustomerRequest(userId, requestId);
    const proposals = await this.listRequestProposals(userId, requestId);

    return {
      request,
      proposals: proposals.map((proposal: any) => ({
        id: proposal.id,
        status: proposal.status,
        vendor: proposal.vendor,
        latestVersion: proposal.versions[0],
        versionNumber: proposal.versions[0]?.versionNumber,
        totalPrice: proposal.versions[0]?.totalPrice,
        advanceAmount: proposal.versions[0]?.advanceAmount,
        inclusions: proposal.versions[0]?.inclusions || [],
        exclusions: proposal.versions[0]?.exclusions || [],
        addOns: proposal.versions[0]?.addOns || [],
        paymentSchedule: proposal.versions[0]?.paymentSchedule,
        teamSize: proposal.versions[0]?.teamSize,
        deliveryTime: proposal.versions[0]?.deliveryTime,
        cancellationPolicy: proposal.versions[0]?.cancellationPolicy,
        validityDate: proposal.versions[0]?.validityDate,
        isExpired: this.isVersionExpired(proposal.versions[0]),
        verificationLevel: proposal.vendor.verificationLevel,
        completedBookings: proposal.vendor.bookings?.length || 0,
        averageRating: this.averageRating(proposal.vendor.reviews || []),
        trustScoreFactors: {
          verificationLevel: proposal.vendor.verificationLevel,
          serviceCount: proposal.vendor.services?.length || 0,
          portfolioItems: proposal.vendor.portfolio?.length || 0,
          reviewCount: proposal.vendor.reviews?.length || 0,
        },
      })),
    };
  }

  async getProposal(userId: string, proposalId: string) {
    const proposal = await this.prisma.proposal.findFirst({
      where: {
        id: proposalId,
        OR: [
          { vendor: { userId } },
          { serviceRequest: { customerId: userId } },
        ],
      },
      include: this.proposalInclude(true),
    });
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    return this.expireProposal(proposal);
  }

  async setCustomerStatus(
    userId: string,
    proposalId: string,
    status: 'SHORTLISTED' | 'ACCEPTED',
  ) {
    const proposal = await this.ensureCustomerProposal(userId, proposalId);
    await this.ensureProposalNotExpired(proposal);
    this.ensureCustomerActionAllowed(proposal, status);
    const updated = await this.prisma.proposal.update({
      where: { id: proposalId },
      data: {
        status,
        shortlistedAt:
          status === 'SHORTLISTED' ? new Date() : proposal.shortlistedAt,
        acceptedAt: status === 'ACCEPTED' ? new Date() : undefined,
      },
    });

    if (status === 'ACCEPTED') {
      await this.prisma.proposal.updateMany({
        where: {
          serviceRequestId: proposal.serviceRequestId,
          id: { not: proposalId },
          status: { notIn: ['REJECTED', 'WITHDRAWN'] },
        },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          customerNote: 'Another proposal was accepted.',
        },
      });
      await this.prisma.serviceRequest.update({
        where: { id: proposal.serviceRequestId },
        data: { status: 'AWARDED' },
      });
      await this.bookingsService.createFromAcceptedProposal(proposalId);
    }

    return status === 'ACCEPTED'
      ? this.getProposal(userId, proposalId)
      : updated;
  }

  async requestRevision(userId: string, proposalId: string, comment?: string) {
    const proposal = await this.ensureCustomerProposal(userId, proposalId);
    await this.ensureProposalNotExpired(proposal);
    this.ensureCustomerActionAllowed(proposal, 'REVISION_REQUESTED');
    if (comment) {
      await this.addComment(userId, proposalId, comment, 'CUSTOMER');
    }
    return this.prisma.proposal.update({
      where: { id: proposalId },
      data: { status: 'REVISION_REQUESTED', customerNote: comment },
    });
  }

  async rejectProposal(userId: string, proposalId: string, comment?: string) {
    const proposal = await this.ensureCustomerProposal(userId, proposalId);
    this.ensureCustomerActionAllowed(proposal, 'REJECTED');
    if (comment) {
      await this.addComment(userId, proposalId, comment, 'CUSTOMER');
    }
    return this.prisma.proposal.update({
      where: { id: proposalId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        customerNote: comment,
      },
    });
  }

  async withdrawProposal(userId: string, proposalId: string) {
    const proposal = await this.ensureVendorProposal(userId, proposalId);
    if (proposal.status === 'ACCEPTED') {
      throw new BadRequestException('Accepted proposals cannot be withdrawn');
    }
    return this.prisma.proposal.update({
      where: { id: proposalId },
      data: { status: 'WITHDRAWN', withdrawnAt: new Date() },
    });
  }

  async addComment(
    userId: string,
    proposalId: string,
    comment: string,
    authorRole?: string,
  ) {
    await this.getProposal(userId, proposalId);
    return this.prisma.proposalComment.create({
      data: {
        proposalId,
        authorId: userId,
        authorRole: authorRole || 'USER',
        comment,
      },
    });
  }

  private async createVersion(
    proposalId: string,
    dto: any,
    versionNumber: number,
    previousVersionId?: string,
  ) {
    if (!dto.totalPrice) {
      throw new BadRequestException('Total price is required');
    }

    return this.prisma.proposalVersion.create({
      data: {
        proposalId,
        versionNumber,
        previousVersionId,
        totalPrice: Number(dto.totalPrice),
        currency: dto.currency || 'PKR',
        packageDescription: dto.packageDescription,
        inclusions: this.toStringArray(dto.inclusions),
        exclusions: this.toStringArray(dto.exclusions),
        addOns: this.toStringArray(dto.addOns),
        teamSize: this.toNumber(dto.teamSize),
        setupTime: dto.setupTime,
        deliveryTime: dto.deliveryTime,
        advanceAmount: this.toNumber(dto.advanceAmount),
        paymentSchedule: dto.paymentSchedule,
        cancellationPolicy: dto.cancellationPolicy,
        validityDate: dto.validityDate ? new Date(dto.validityDate) : undefined,
        terms: dto.terms,
        changeSummary: dto.changeSummary,
        attachments: this.toStringArray(dto.attachments),
      },
    });
  }

  private async markInvitationResponded(
    serviceRequestId: string,
    vendorId: string,
  ) {
    await this.prisma.serviceRequestInvitation.updateMany({
      where: { serviceRequestId, vendorId },
      data: { status: 'RESPONDED' },
    });
  }

  private async ensureVendor(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new NotFoundException('Vendor profile not found');
    return vendor;
  }

  private async ensureVendorProposal(userId: string, proposalId: string) {
    const proposal = await this.prisma.proposal.findFirst({
      where: { id: proposalId, vendor: { userId } },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
    });
    if (!proposal) throw new NotFoundException('Proposal not found');
    return proposal;
  }

  private async ensureCustomerProposal(userId: string, proposalId: string) {
    const proposal = await this.prisma.proposal.findFirst({
      where: { id: proposalId, serviceRequest: { customerId: userId } },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
    });
    if (!proposal) throw new NotFoundException('Proposal not found');
    return proposal;
  }

  private async ensureCustomerRequest(userId: string, requestId: string) {
    const request = await this.prisma.serviceRequest.findFirst({
      where: { id: requestId, customerId: userId },
      include: { category: true, wedding: true, event: true },
    });
    if (!request) throw new NotFoundException('Service request not found');
    return request;
  }

  private nextProposalStatus(
    currentStatus: string | undefined,
    dto: any,
    versionNumber = 1,
  ): ProposalWriteStatus {
    if (dto.submit === false) {
      const publicStatuses: ProposalWriteStatus[] = [
        'SUBMITTED',
        'VIEWED',
        'SHORTLISTED',
        'REVISION_REQUESTED',
        'REVISED',
      ];
      return publicStatuses.includes(currentStatus as ProposalWriteStatus)
        ? (currentStatus as ProposalWriteStatus)
        : 'DRAFT';
    }
    return versionNumber > 1 || currentStatus === 'REVISION_REQUESTED'
      ? 'REVISED'
      : 'SUBMITTED';
  }

  private ensureCustomerActionAllowed(proposal: any, action: string) {
    const invalidStatuses = ['DRAFT', 'WITHDRAWN', 'REJECTED', 'EXPIRED'];
    if (invalidStatuses.includes(proposal.status)) {
      throw new BadRequestException(
        `Cannot ${action.toLowerCase().replaceAll('_', ' ')} this proposal`,
      );
    }
    if (action === 'ACCEPTED' && proposal.status === 'ACCEPTED') {
      throw new BadRequestException('Proposal is already accepted');
    }
  }

  private async ensureProposalNotExpired(proposal: any) {
    if (this.isVersionExpired(proposal.versions?.[0])) {
      await this.prisma.proposal.update({
        where: { id: proposal.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('Proposal has expired');
    }
  }

  private async expireProposalList(proposals: any[]) {
    return Promise.all(
      proposals.map((proposal) => this.expireProposal(proposal)),
    );
  }

  private async expireProposal(proposal: any) {
    if (
      proposal.status !== 'EXPIRED' &&
      !['ACCEPTED', 'REJECTED', 'WITHDRAWN'].includes(proposal.status) &&
      this.isVersionExpired(proposal.versions?.[0])
    ) {
      await this.prisma.proposal.update({
        where: { id: proposal.id },
        data: { status: 'EXPIRED' },
      });
      return { ...proposal, status: 'EXPIRED' };
    }
    return proposal;
  }

  private isVersionExpired(version?: any) {
    return Boolean(
      version?.validityDate &&
      new Date(version.validityDate).getTime() < Date.now(),
    );
  }

  private averageRating(reviews: any[]) {
    const ratings = reviews
      .filter(
        (review) =>
          review.status === undefined || review.status === 'PUBLISHED',
      )
      .map((review) => Number(review.rating || 0))
      .filter((rating) => rating > 0);
    if (!ratings.length) return null;
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  }

  private proposalInclude(full = false) {
    return {
      vendor: {
        include: {
          services: { include: { category: true } },
          portfolio: { take: 3 },
          reviews: true,
          bookings: true,
        },
      },
      serviceRequest: {
        include: { category: true, wedding: true, event: true },
      },
      versions: { orderBy: { versionNumber: 'desc' as const } },
      comments: full ? { orderBy: { createdAt: 'desc' as const } } : true,
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
}
