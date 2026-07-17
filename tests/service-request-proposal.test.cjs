require('ts-node/register/transpile-only');

const assert = require('node:assert/strict');
const { BadRequestException, NotFoundException } = require('@nestjs/common');
const {
  ServiceRequestsService,
} = require('../apps/api/src/service-requests/service-requests.service');
const {
  ProposalsService,
} = require('../apps/api/src/proposals/proposals.service');

class MarketplacePrisma {
  constructor() {
    this.categories = [
      { id: 'cat-photo', slug: 'photography', name: 'Photography' },
      { id: 'cat-decor', slug: 'decor', name: 'Decor' },
    ];
    this.weddings = [{ id: 'wedding-1', ownerId: 'customer-1' }];
    this.requests = [];
    this.matches = [];
    this.invitations = [];
    this.proposals = [];
    this.versions = [];
    this.comments = [];
    this.bookings = [];

    this.vendors = [
      {
        id: 'vendor-1',
        userId: 'vendor-user-1',
        businessName: 'Noor Photo Studio',
        city: 'Lahore',
        serviceAreas: ['Lahore', 'Islamabad'],
        startingPrice: 120000,
        verificationStatus: 'APPROVED',
        verificationLevel: 'BUSINESS_VERIFIED',
        isActive: true,
        services: [
          {
            id: 'service-1',
            vendorId: 'vendor-1',
            categoryId: 'cat-photo',
            isActive: true,
            serviceAreas: ['Lahore'],
            startingPrice: 120000,
            capacity: 350,
            category: this.categories[0],
          },
        ],
        packages: [{ id: 'package-1', vendorId: 'vendor-1', price: 150000 }],
        teams: [{ id: 'team-1', vendorId: 'vendor-1', capacity: 350 }],
        availability: [
          {
            id: 'availability-1',
            vendorId: 'vendor-1',
            date: new Date('2026-12-10'),
            status: 'AVAILABLE',
            capacity: 350,
          },
        ],
        reviews: [
          { id: 'review-1', rating: 5, status: 'PUBLISHED' },
          { id: 'review-2', rating: 4, status: 'PUBLISHED' },
        ],
        portfolio: [
          { id: 'portfolio-1', imageUrl: 'https://example.test/a.jpg' },
        ],
        bookings: [],
      },
      {
        id: 'vendor-2',
        userId: 'vendor-user-2',
        businessName: 'Wrong Category Decor',
        city: 'Karachi',
        serviceAreas: ['Karachi'],
        startingPrice: 500000,
        verificationStatus: 'PENDING',
        verificationLevel: 'UNVERIFIED',
        isActive: true,
        services: [
          {
            id: 'service-2',
            vendorId: 'vendor-2',
            categoryId: 'cat-decor',
            isActive: true,
            category: this.categories[1],
          },
        ],
        packages: [],
        teams: [],
        availability: [],
        reviews: [{ id: 'review-3', rating: 3, status: 'PUBLISHED' }],
        portfolio: [],
        bookings: [],
      },
    ];

    this.wedding = {
      findFirst: async ({ where }) =>
        this.weddings.find(
          (wedding) =>
            wedding.id === where.id && wedding.ownerId === where.ownerId,
        ) || null,
    };

    this.serviceCategory = {
      findUnique: async ({ where }) =>
        this.categories.find((category) =>
          where.id ? category.id === where.id : category.slug === where.slug,
        ) || null,
    };

    this.vendor = {
      findUnique: async ({ where }) =>
        this.vendors.find((vendor) =>
          where.id ? vendor.id === where.id : vendor.userId === where.userId,
        ) || null,
      findMany: async ({ where }) =>
        this.vendors.filter(
          (vendor) =>
            (where.isActive === undefined ||
              vendor.isActive === where.isActive) &&
            (!where.verificationStatus?.not ||
              vendor.verificationStatus !== where.verificationStatus.not),
        ),
    };

    this.serviceRequest = {
      create: async ({ data }) => {
        const request = {
          id: `request-${this.requests.length + 1}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        this.requests.push(request);
        return this.hydrateRequest(request);
      },
      findFirst: async ({ where }) => {
        const request = this.requests.find((item) =>
          this.matchesRequestWhere(item, where),
        );
        return request ? this.hydrateRequest(request) : null;
      },
      findUnique: async ({ where }) => {
        const request = this.requests.find((item) => item.id === where.id);
        return request ? this.hydrateRequest(request) : null;
      },
      findMany: async ({ where = {} } = {}) =>
        this.requests
          .filter((request) => this.matchesRequestWhere(request, where))
          .map((request) => this.hydrateRequest(request)),
      update: async ({ where, data }) => {
        const request = this.requests.find((item) => item.id === where.id);
        Object.assign(request, data, { updatedAt: new Date() });
        return this.hydrateRequest(request);
      },
    };

    this.serviceRequestMatch = {
      upsert: async ({ where, create, update }) => {
        const key = where.serviceRequestId_vendorId;
        let match = this.matches.find(
          (item) =>
            item.serviceRequestId === key.serviceRequestId &&
            item.vendorId === key.vendorId,
        );
        if (!match) {
          match = {
            id: `match-${this.matches.length + 1}`,
            createdAt: new Date(),
            ...create,
          };
          this.matches.push(match);
        } else {
          Object.assign(match, update);
        }
        return this.hydrateMatch(match);
      },
      findMany: async ({ where }) =>
        this.matches
          .filter((match) => match.serviceRequestId === where.serviceRequestId)
          .sort((a, b) => b.score - a.score)
          .map((match) => this.hydrateMatch(match)),
      deleteMany: async ({ where }) => {
        const before = this.matches.length;
        this.matches = this.matches.filter((match) => {
          if (match.serviceRequestId !== where.serviceRequestId) return true;
          if (where.vendorId?.notIn) {
            return where.vendorId.notIn.includes(match.vendorId);
          }
          return false;
        });
        return { count: before - this.matches.length };
      },
    };

    this.serviceRequestInvitation = {
      upsert: async ({ where, create, update }) => {
        const key = where.serviceRequestId_vendorId;
        let invitation = this.invitations.find(
          (item) =>
            item.serviceRequestId === key.serviceRequestId &&
            item.vendorId === key.vendorId,
        );
        if (!invitation) {
          invitation = {
            id: `invitation-${this.invitations.length + 1}`,
            status: 'INVITED',
            createdAt: new Date(),
            ...create,
          };
          this.invitations.push(invitation);
        } else {
          Object.assign(invitation, update);
        }
        return { ...invitation, vendor: this.findVendor(invitation.vendorId) };
      },
      updateMany: async ({ where, data }) => {
        let count = 0;
        for (const invitation of this.invitations) {
          if (
            invitation.serviceRequestId === where.serviceRequestId &&
            invitation.vendorId === where.vendorId
          ) {
            Object.assign(invitation, data);
            count += 1;
          }
        }
        return { count };
      },
    };

    this.proposal = {
      create: async ({ data }) => {
        const proposal = {
          id: `proposal-${this.proposals.length + 1}`,
          latestVersionId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        this.proposals.push(proposal);
        return proposal;
      },
      findUnique: async ({ where, include }) => {
        const proposal = this.findProposalByWhere(where);
        return proposal ? this.hydrateProposal(proposal, include) : null;
      },
      findFirst: async ({ where, include }) => {
        const proposal = this.proposals.find((item) =>
          this.matchesProposalWhere(item, where),
        );
        return proposal ? this.hydrateProposal(proposal, include) : null;
      },
      findMany: async ({ where = {}, include } = {}) =>
        this.proposals
          .filter((proposal) => this.matchesProposalWhere(proposal, where))
          .map((proposal) => this.hydrateProposal(proposal, include)),
      update: async ({ where, data }) => {
        const proposal = this.proposals.find((item) => item.id === where.id);
        Object.assign(proposal, data, { updatedAt: new Date() });
        return proposal;
      },
      updateMany: async ({ where, data }) => {
        let count = 0;
        for (const proposal of this.proposals) {
          if (this.matchesProposalWhere(proposal, where)) {
            Object.assign(proposal, data, { updatedAt: new Date() });
            count += 1;
          }
        }
        return { count };
      },
    };

    this.proposalVersion = {
      create: async ({ data }) => {
        assert.equal(
          this.versions.some(
            (version) =>
              version.proposalId === data.proposalId &&
              version.versionNumber === data.versionNumber,
          ),
          false,
          'proposal versions must be immutable and unique',
        );
        const version = {
          id: `version-${this.versions.length + 1}`,
          createdAt: new Date(),
          ...data,
        };
        this.versions.push(version);
        return version;
      },
    };

    this.proposalComment = {
      create: async ({ data }) => {
        const comment = { id: `comment-${this.comments.length + 1}`, ...data };
        this.comments.push(comment);
        return comment;
      },
    };
  }

  findVendor(vendorId) {
    return this.vendors.find((vendor) => vendor.id === vendorId);
  }

  hydrateRequest(request) {
    return {
      ...request,
      category: this.categories.find((item) => item.id === request.categoryId),
      wedding: this.weddings.find((item) => item.id === request.weddingId),
      event: null,
      invitations: this.invitations.filter(
        (item) => item.serviceRequestId === request.id,
      ),
      matches: this.matches
        .filter((item) => item.serviceRequestId === request.id)
        .map((item) => this.hydrateMatch(item)),
    };
  }

  hydrateMatch(match) {
    return {
      ...match,
      vendor: this.findVendor(match.vendorId),
    };
  }

  hydrateProposal(proposal, include) {
    const versions = this.versions
      .filter((version) => version.proposalId === proposal.id)
      .sort((a, b) => b.versionNumber - a.versionNumber);
    return {
      ...proposal,
      vendor: include?.vendor ? this.findVendor(proposal.vendorId) : undefined,
      serviceRequest: include?.serviceRequest
        ? this.hydrateRequest(
            this.requests.find((item) => item.id === proposal.serviceRequestId),
          )
        : undefined,
      versions,
      comments: this.comments.filter((item) => item.proposalId === proposal.id),
    };
  }

  findProposalByWhere(where) {
    if (where.id) return this.proposals.find((item) => item.id === where.id);
    if (where.serviceRequestId_vendorId) {
      return this.proposals.find(
        (item) =>
          item.serviceRequestId ===
            where.serviceRequestId_vendorId.serviceRequestId &&
          item.vendorId === where.serviceRequestId_vendorId.vendorId,
      );
    }
    return null;
  }

  matchesRequestWhere(request, where = {}) {
    if (where.id && request.id !== where.id) return false;
    if (where.customerId && request.customerId !== where.customerId)
      return false;
    if (where.status?.in && !where.status.in.includes(request.status)) {
      return false;
    }
    if (typeof where.status === 'string' && request.status !== where.status) {
      return false;
    }
    if (where.visibility && request.visibility !== where.visibility)
      return false;
    return true;
  }

  matchesProposalWhere(proposal, where = {}) {
    if (where.id && proposal.id !== where.id) return false;
    if (where.vendorId && proposal.vendorId !== where.vendorId) return false;
    if (
      where.serviceRequestId &&
      proposal.serviceRequestId !== where.serviceRequestId
    ) {
      return false;
    }
    if (where.id?.not && proposal.id === where.id.not) return false;
    if (where.status?.not && proposal.status === where.status.not) return false;
    if (where.status?.notIn && where.status.notIn.includes(proposal.status)) {
      return false;
    }
    if (where.serviceRequest?.customerId) {
      const request = this.requests.find(
        (item) => item.id === proposal.serviceRequestId,
      );
      if (request?.customerId !== where.serviceRequest.customerId) return false;
    }
    if (where.vendor?.userId) {
      const vendor = this.findVendor(proposal.vendorId);
      if (vendor?.userId !== where.vendor.userId) return false;
    }
    if (where.OR) {
      return where.OR.some((condition) =>
        this.matchesProposalWhere(proposal, condition),
      );
    }
    return true;
  }
}

function futureDate(days = 30) {
  return new Date(Date.now() + days * 86400000).toISOString();
}

function pastDate(days = 1) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

async function run() {
  const prisma = new MarketplacePrisma();
  const bookingsService = {
    created: [],
    createFromAcceptedProposal: async (proposalId) => {
      bookingsService.created.push(proposalId);
      return { id: `booking-${bookingsService.created.length}`, proposalId };
    },
  };
  const requestsService = new ServiceRequestsService(prisma);
  const proposalsService = new ProposalsService(prisma, bookingsService);

  const draft = await requestsService.createRequest('customer-1', {
    weddingId: 'wedding-1',
    categorySlug: 'photography',
    title: 'Baraat photography',
    city: 'Lahore',
    eventDate: '2026-12-10',
    guestCount: 300,
    maxBudget: 200000,
    description: 'Need photo and video coverage.',
  });
  assert.equal(draft.status, 'DRAFT');

  const published = await requestsService.publishRequest(
    'customer-1',
    draft.id,
  );
  assert.equal(published.status, 'PUBLISHED');

  const matches = await requestsService.matchingVendors('customer-1', draft.id);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].vendorId, 'vendor-1');
  assert.ok(matches[0].score >= 90);
  assert.ok(matches[0].reasons.includes('Category match'));
  assert.ok(matches[0].reasons.some((reason) => reason.startsWith('Rating')));

  const vendorRequests =
    await requestsService.matchingRequestsForVendor('vendor-user-1');
  assert.equal(vendorRequests.length, 1);
  assert.equal(vendorRequests[0].request.id, draft.id);

  await requestsService.inviteVendor(
    'customer-1',
    draft.id,
    'vendor-1',
    'Please quote your best package.',
  );

  const v1Result = await proposalsService.createProposal(
    'vendor-user-1',
    draft.id,
    {
      submit: true,
      totalPrice: 180000,
      advanceAmount: 50000,
      packageDescription: 'Full day photo and video team.',
      inclusions: ['Lead photographer', 'Highlights film'],
      exclusions: ['Drone permit'],
      addOns: ['Same-day edit'],
      paymentSchedule: '50,000 advance and balance before event.',
      cancellationPolicy: 'Refundable until 14 days before the event.',
      validityDate: futureDate(),
    },
  );
  assert.equal(v1Result.status, 'SUBMITTED');
  assert.equal(v1Result.versions.length, 1);
  assert.equal(v1Result.versions[0].versionNumber, 1);
  assert.equal(
    prisma.invitations.find((item) => item.vendorId === 'vendor-1').status,
    'RESPONDED',
  );

  await proposalsService.requestRevision(
    'customer-1',
    v1Result.id,
    'Please add a second shooter.',
  );

  const v2Result = await proposalsService.reviseProposal(
    'vendor-user-1',
    v1Result.id,
    {
      submit: true,
      totalPrice: 195000,
      advanceAmount: 60000,
      packageDescription: 'Full day team with second shooter.',
      inclusions: ['Lead photographer', 'Second shooter', 'Highlights film'],
      exclusions: ['Drone permit'],
      addOns: ['Same-day edit', 'Extra album'],
      paymentSchedule: '60,000 advance and balance before event.',
      cancellationPolicy: 'Refundable until 10 days before the event.',
      validityDate: futureDate(),
      changeSummary: 'Added second shooter and extra album option.',
    },
  );
  assert.equal(v2Result.status, 'REVISED');
  assert.equal(v2Result.versions.length, 2);

  const v1 = v2Result.versions.find((version) => version.versionNumber === 1);
  const v2 = v2Result.versions.find((version) => version.versionNumber === 2);
  assert.equal(Number(v1.totalPrice), 180000);
  assert.deepEqual(v1.inclusions, ['Lead photographer', 'Highlights film']);
  assert.equal(v2.previousVersionId, v1.id);
  assert.equal(Number(v2.totalPrice), 195000);

  const comparison = await proposalsService.compareProposals(
    'customer-1',
    draft.id,
  );
  assert.equal(comparison.proposals.length, 1);
  assert.equal(comparison.proposals[0].versionNumber, 2);
  assert.deepEqual(comparison.proposals[0].addOns, [
    'Same-day edit',
    'Extra album',
  ]);
  assert.equal(
    comparison.proposals[0].paymentSchedule,
    '60,000 advance and balance before event.',
  );
  assert.equal(comparison.proposals[0].isExpired, false);

  await proposalsService.setCustomerStatus(
    'customer-1',
    v1Result.id,
    'SHORTLISTED',
  );
  const accepted = await proposalsService.setCustomerStatus(
    'customer-1',
    v1Result.id,
    'ACCEPTED',
  );
  assert.equal(accepted.status, 'ACCEPTED');
  assert.equal(bookingsService.created[0], v1Result.id);
  assert.equal(
    prisma.requests.find((request) => request.id === draft.id).status,
    'AWARDED',
  );

  const expiryRequest = await requestsService.createRequest('customer-1', {
    weddingId: 'wedding-1',
    categorySlug: 'photography',
    title: 'Expired quote request',
    city: 'Lahore',
    eventDate: '2026-12-10',
    guestCount: 100,
    maxBudget: 200000,
    description: 'Need a short event quote.',
    status: 'PUBLISHED',
  });
  const expiredProposal = await proposalsService.createProposal(
    'vendor-user-1',
    expiryRequest.id,
    {
      submit: true,
      totalPrice: 120000,
      validityDate: pastDate(),
    },
  );
  const expiredList = await proposalsService.listRequestProposals(
    'customer-1',
    expiryRequest.id,
  );
  assert.equal(expiredList[0].status, 'EXPIRED');
  await assert.rejects(
    () =>
      proposalsService.setCustomerStatus(
        'customer-1',
        expiredProposal.id,
        'ACCEPTED',
      ),
    BadRequestException,
  );

  const draftRequest = await requestsService.createRequest('customer-1', {
    weddingId: 'wedding-1',
    categorySlug: 'photography',
    title: 'Draft proposal request',
    city: 'Lahore',
    eventDate: '2026-12-10',
    guestCount: 100,
    maxBudget: 200000,
    description: 'Need a draft quote.',
    status: 'PUBLISHED',
  });
  const draftProposal = await proposalsService.createProposal(
    'vendor-user-1',
    draftRequest.id,
    {
      submit: false,
      totalPrice: 110000,
      validityDate: futureDate(),
    },
  );
  await assert.rejects(
    () =>
      proposalsService.setCustomerStatus(
        'customer-1',
        draftProposal.id,
        'ACCEPTED',
      ),
    BadRequestException,
  );
  await assert.rejects(
    () =>
      proposalsService.setCustomerStatus(
        'customer-2',
        draftProposal.id,
        'ACCEPTED',
      ),
    NotFoundException,
  );

  console.log('Service request and proposal tests passed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
