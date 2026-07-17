require('ts-node/register/transpile-only');

const assert = require('node:assert/strict');
const { BadRequestException, NotFoundException } = require('@nestjs/common');
const { VendorsService } = require('../apps/api/src/vendors/vendors.service');
const { AdminService } = require('../apps/api/src/admin/admin.service');

class VendorPrisma {
  constructor() {
    this.categories = [
      { id: 'cat-photo', slug: 'photography', name: 'Photographers' },
      { id: 'cat-decor', slug: 'decor', name: 'Decorators' },
    ];
    this.vendors = [
      {
        id: 'vendor-1',
        userId: 'vendor-user-1',
        businessName: 'Noor Photo Studio',
        ownerName: 'Demo Owner',
        city: 'Lahore',
        serviceAreas: ['Lahore', 'Islamabad'],
        startingPrice: 120000,
        isActive: true,
        verificationStatus: 'APPROVED',
        verificationLevel: 'BUSINESS_VERIFIED',
        reviews: [
          { rating: 5, wouldRecommend: true },
          { rating: 4, wouldRecommend: true },
        ],
        services: [
          {
            id: 'service-existing',
            vendorId: 'vendor-1',
            isActive: true,
            title: 'Wedding Photography',
            category: this.categories[0],
          },
        ],
        portfolio: [],
        packages: [],
        availability: [
          {
            id: 'availability-open',
            vendorId: 'vendor-1',
            teamId: 'team-1',
            date: new Date('2026-09-01'),
            status: 'AVAILABLE',
          },
        ],
        bookings: [{ id: 'booking-1' }],
        disputes: [],
        trustSignals: [],
      },
      {
        id: 'vendor-2',
        userId: 'vendor-user-2',
        businessName: 'Rang Decor House',
        ownerName: 'Demo Decor',
        city: 'Karachi',
        serviceAreas: ['Karachi'],
        startingPrice: 350000,
        isActive: true,
        verificationStatus: 'PENDING',
        verificationLevel: 'IDENTITY_VERIFIED',
        reviews: [{ rating: 3, wouldRecommend: true }],
        services: [
          {
            id: 'service-decor',
            vendorId: 'vendor-2',
            isActive: true,
            title: 'Stage Decor',
            category: this.categories[1],
          },
        ],
        portfolio: [],
        packages: [],
        availability: [],
        bookings: [],
        disputes: [],
        trustSignals: [],
      },
      {
        id: 'vendor-3',
        userId: 'vendor-user-3',
        businessName: 'Suspended Vendor',
        ownerName: 'Paused Owner',
        city: 'Lahore',
        serviceAreas: ['Lahore'],
        startingPrice: 90000,
        isActive: false,
        verificationStatus: 'SUSPENDED',
        verificationLevel: 'UNVERIFIED',
        reviews: [{ rating: 5, wouldRecommend: false }],
        services: [],
        portfolio: [],
        packages: [],
        availability: [],
        bookings: [],
        disputes: [],
        trustSignals: [],
      },
    ];
    this.services = [...this.vendors[0].services, ...this.vendors[1].services];
    this.packages = [];
    this.availability = [
      {
        id: 'reserved-slot',
        vendorId: 'vendor-1',
        teamId: 'team-1',
        date: new Date('2026-10-10'),
        status: 'BOOKED',
      },
    ];
    this.verifications = [
      {
        id: 'verification-1',
        vendorId: 'vendor-2',
        status: 'PENDING',
        vendor: this.vendors[1],
      },
    ];
    this.auditLogs = [];
    this.users = [{ id: 'vendor-user-2', isSuspended: false }];

    this.vendor = {
      findFirst: async ({ where }) => this.findVendor(where),
      findUnique: async ({ where }) =>
        this.vendors.find((vendor) =>
          where.id ? vendor.id === where.id : vendor.userId === where.userId,
        ) || null,
      findMany: async ({ where }) =>
        this.vendors.filter((vendor) => this.matchesVendorWhere(vendor, where)),
      upsert: async ({ where, create, update }) => {
        let vendor = this.vendors.find((item) => item.userId === where.userId);
        if (!vendor) {
          vendor = { id: `vendor-${this.vendors.length + 1}`, ...create };
          this.vendors.push(vendor);
        } else {
          Object.assign(vendor, update);
        }
        return vendor;
      },
      update: async ({ where, data }) => {
        const vendor = this.vendors.find((item) => item.id === where.id);
        Object.assign(vendor, data);
        return vendor;
      },
      count: async () => this.vendors.length,
    };

    this.userProfile = {
      upsert: async () => ({}),
    };

    this.serviceCategory = {
      findUnique: async ({ where }) =>
        this.categories.find((category) =>
          where.slug ? category.slug === where.slug : category.id === where.id,
        ) || null,
    };

    this.serviceListing = {
      create: async ({ data }) => {
        const service = {
          id: `service-${this.services.length + 1}`,
          isActive: true,
          ...data,
          category: this.categories.find(
            (category) => category.id === data.categoryId,
          ),
        };
        this.services.push(service);
        return service;
      },
      findFirst: async ({ where }) =>
        this.services.find((service) => {
          const vendor = this.vendors.find(
            (item) => item.id === service.vendorId,
          );
          return (
            service.id === where.id &&
            (!where.vendor?.userId || vendor?.userId === where.vendor.userId)
          );
        }) || null,
    };

    this.servicePackage = {
      create: async ({ data }) => {
        const item = { id: `package-${this.packages.length + 1}`, ...data };
        this.packages.push(item);
        return item;
      },
      findFirst: async () => null,
      update: async () => null,
    };

    this.vendorAvailability = {
      findFirst: async ({ where }) =>
        this.availability.find(
          (slot) =>
            slot.vendorId === where.vendorId &&
            slot.teamId === where.teamId &&
            slot.date.getTime() === where.date.getTime() &&
            where.status?.in?.includes(slot.status) &&
            (!where.id?.not || slot.id !== where.id.not),
        ) || null,
      create: async ({ data }) => {
        const slot = {
          id: `availability-${this.availability.length + 1}`,
          ...data,
        };
        this.availability.push(slot);
        return slot;
      },
    };

    this.vendorVerification = {
      findUnique: async ({ where }) =>
        this.verifications.find((item) => item.id === where.id) || null,
      update: async ({ where, data }) => {
        const verification = this.verifications.find(
          (item) => item.id === where.id,
        );
        Object.assign(verification, data);
        return verification;
      },
      count: async () =>
        this.verifications.filter((item) => item.status === 'PENDING').length,
    };

    this.user = {
      count: async () => this.users.length,
      update: async ({ where, data }) => {
        const user = this.users.find((item) => item.id === where.id);
        Object.assign(user, data);
        return user;
      },
    };

    this.auditLog = {
      count: async () => this.auditLogs.length,
      create: async ({ data }) => {
        this.auditLogs.push(data);
        return data;
      },
    };
  }

  findVendor(where) {
    return (
      this.vendors.find((vendor) => {
        if (where.id && vendor.id !== where.id) return false;
        if (where.userId && vendor.userId !== where.userId) return false;
        if (where.isActive !== undefined && vendor.isActive !== where.isActive)
          return false;
        if (
          where.verificationStatus?.not &&
          vendor.verificationStatus === where.verificationStatus.not
        )
          return false;
        return true;
      }) || null
    );
  }

  matchesVendorWhere(vendor, where) {
    if (where.isActive !== undefined && vendor.isActive !== where.isActive)
      return false;
    if (
      where.verificationStatus?.not &&
      vendor.verificationStatus === where.verificationStatus.not
    )
      return false;
    if (
      typeof where.verificationStatus === 'string' &&
      vendor.verificationStatus !== where.verificationStatus
    )
      return false;
    if (
      where.verificationLevel &&
      vendor.verificationLevel !== where.verificationLevel
    )
      return false;
    if (
      where.startingPrice?.gte &&
      vendor.startingPrice < where.startingPrice.gte
    )
      return false;
    if (
      where.startingPrice?.lte &&
      vendor.startingPrice > where.startingPrice.lte
    )
      return false;
    for (const condition of where.AND || []) {
      if (condition.OR) {
        const city = condition.OR.some(
          (entry) =>
            entry.city?.contains === vendor.city ||
            vendor.serviceAreas.includes(entry.serviceAreas?.has),
        );
        const text = condition.OR.some(
          (entry) =>
            entry.businessName?.contains &&
            vendor.businessName
              .toLowerCase()
              .includes(entry.businessName.contains.toLowerCase()),
        );
        if (!city && !text) return false;
      }
      if (condition.services?.some?.category?.slug) {
        if (
          !vendor.services.some(
            (service) =>
              service.category?.slug === condition.services.some.category.slug,
          )
        )
          return false;
      }
      if (condition.availability?.some?.status) {
        const status = condition.availability.some.status;
        const statuses = Array.isArray(status.in) ? status.in : [status];
        if (!vendor.availability.some((slot) => statuses.includes(slot.status)))
          return false;
      }
    }
    return true;
  }
}

async function run() {
  const prisma = new VendorPrisma();
  const vendorsService = new VendorsService(prisma);
  const adminService = new AdminService(prisma);

  await assert.rejects(
    () =>
      vendorsService.updateVendor('wrong-user', 'vendor-1', { city: 'Multan' }),
    NotFoundException,
  );

  const service = await vendorsService.addService('vendor-user-1', 'vendor-1', {
    title: 'Luxury Wedding Shoot',
    categorySlug: 'photography',
    startingPrice: 180000,
    serviceAreas: 'Lahore, Islamabad',
    inclusions: 'Shoot, Edited album',
  });
  assert.equal(service.vendorId, 'vendor-1');
  assert.equal(service.category.slug, 'photography');

  const pkg = await vendorsService.addPackage('vendor-user-1', service.id, {
    name: 'Gold Package',
    price: 250000,
    includedItems: 'Two photographers, Album',
  });
  assert.equal(pkg.vendorId, 'vendor-1');
  assert.equal(pkg.serviceId, service.id);

  await assert.rejects(
    () =>
      vendorsService.addAvailability('vendor-user-1', 'vendor-1', {
        teamId: 'team-1',
        date: '2026-10-10',
        status: 'AVAILABLE',
      }),
    BadRequestException,
  );

  const available = await vendorsService.addAvailability(
    'vendor-user-1',
    'vendor-1',
    {
      teamId: 'team-1',
      date: '2026-10-11',
      status: 'AVAILABLE',
    },
  );
  assert.equal(available.status, 'AVAILABLE');

  const approved = await adminService.reviewVendorVerification(
    'admin-1',
    'verification-1',
    {
      status: 'APPROVED',
      verificationLevel: 'BUSINESS_VERIFIED',
      reviewComment: 'Documents verified',
    },
  );
  assert.equal(approved.status, 'APPROVED');
  assert.equal(prisma.vendors[1].verificationStatus, 'APPROVED');

  const suspended = await adminService.updateVendorStatus(
    'admin-1',
    'vendor-2',
    {
      status: 'SUSPENDED',
    },
  );
  assert.equal(suspended.isActive, false);
  assert.equal(suspended.verificationStatus, 'SUSPENDED');
  assert.equal(prisma.users[0].isSuspended, true);

  const filtered = await vendorsService.listVendors({
    city: 'Lahore',
    category: 'photography',
    minPrice: '100000',
    maxPrice: '200000',
    minRating: '4.5',
    availability: 'AVAILABLE',
    verificationStatus: 'APPROVED',
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, 'vendor-1');
  assert.ok(
    !filtered.some((vendor) => vendor.verificationStatus === 'SUSPENDED'),
  );

  console.log('Vendor and marketplace tests passed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
