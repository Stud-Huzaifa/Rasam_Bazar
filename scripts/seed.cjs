const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^"|"$/g, '');
    }
  }
}

const prisma = new PrismaClient();

const PASSWORD = 'Password123!';
const BASE_DATE = new Date('2026-07-15T09:00:00.000Z');

const roles = [
  'CUSTOMER',
  'WEDDING_OWNER',
  'FAMILY_MEMBER',
  'VENDOR_OWNER',
  'VENDOR_STAFF',
  'SUPPORT_OFFICER',
  'ADMIN',
];

const cities = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Hyderabad',
  'Sialkot',
  'Gujranwala',
];

const categorySpecs = [
  [
    'Wedding Halls',
    'Wedding halls and formal reception venues',
    'wedding-halls',
    'venue',
    320000,
  ],
  [
    'Banquet Halls',
    'Indoor banquets, marquees, and reception halls',
    'banquet-halls',
    'venue',
    280000,
  ],
  [
    'Farmhouses',
    'Outdoor lawns and farmhouse wedding spaces',
    'farmhouses',
    'venue',
    380000,
  ],
  [
    'Caterers',
    'Buffet, live stations, serving staff, and desi menus',
    'catering',
    'food',
    1800,
  ],
  [
    'Photographers',
    'Wedding photography, portraits, albums, and coverage',
    'photography',
    'photo',
    150000,
  ],
  [
    'Videographers',
    'Cinematic wedding films, drone, and teasers',
    'videography',
    'photo',
    180000,
  ],
  [
    'Makeup Artists',
    'Bridal makeup, party makeup, and styling',
    'makeup',
    'makeup',
    85000,
  ],
  [
    'Mehndi Artists',
    'Bridal mehndi, family mehndi, and event stalls',
    'mehndi-artists',
    'makeup',
    45000,
  ],
  [
    'Decorators',
    'Event decor, themes, entrances, and floral styling',
    'decoration',
    'decor',
    220000,
  ],
  [
    'Event Planners',
    'Full-service coordination and wedding management',
    'event-planners',
    'planning',
    260000,
  ],
  [
    'DJs & Sound',
    'DJs, speakers, mics, and event sound systems',
    'dj-sound',
    'music',
    90000,
  ],
  [
    'Qawwali & Dhol',
    'Qawwali nights, dhol players, and traditional music',
    'qawwali-dhol',
    'music',
    70000,
  ],
  [
    'Lighting Services',
    'Architectural lighting, stage lighting, and fairy lights',
    'lighting-services',
    'decor',
    120000,
  ],
  [
    'Florists',
    'Fresh floral arrangements, varmala, bouquets, and car florals',
    'florists',
    'floral',
    95000,
  ],
  [
    'Bridal Wear Designers',
    'Bridal lehenga, sharara, gharara, and couture fittings',
    'bridal-wear',
    'fashion',
    350000,
  ],
  [
    'Groom Wear',
    'Sherwani, waistcoat, prince coat, and groom styling',
    'groom-wear',
    'fashion',
    140000,
  ],
  [
    'Jewellery',
    'Bridal jewellery, sets, matha patti, bangles, and rentals',
    'jewellery',
    'fashion',
    180000,
  ],
  [
    'Invitation Printing',
    'Printed cards, digital invites, boxes, and stationery',
    'invitation-printing',
    'print',
    45000,
  ],
  [
    'Wedding Cakes',
    'Tiered cakes, dessert tables, and custom sweets',
    'wedding-cakes',
    'food',
    65000,
  ],
  [
    'Car Rentals',
    'Bridal cars, family cars, and decorated vehicles',
    'car-rentals',
    'transport',
    55000,
  ],
  [
    'Luxury Cars',
    'Premium bridal entry cars and luxury rentals',
    'luxury-cars',
    'transport',
    120000,
  ],
  [
    'Horse & Buggy',
    'Traditional groom entry, baggi, horse, and handlers',
    'horse-buggy',
    'transport',
    85000,
  ],
  [
    'Transport Services',
    'Guest vans, coasters, airport pickup, and logistics',
    'transport-services',
    'transport',
    70000,
  ],
  [
    'Hotels',
    'Room blocks, bridal suites, and guest accommodation',
    'hotels',
    'hotel',
    180000,
  ],
  [
    'Honeymoon Planners',
    'Domestic and international honeymoon planning',
    'honeymoon-planners',
    'travel',
    260000,
  ],
  [
    'Gift Packaging',
    'Mayun trays, mithai boxes, favors, and welcome hampers',
    'gift-packaging',
    'gift',
    55000,
  ],
  [
    'Stage Designers',
    'Custom stages, platforms, backdrops, and seating zones',
    'stage-designers',
    'decor',
    260000,
  ],
];

const eventTypes = ['Mehndi', 'Nikah', 'Baraat', 'Walima'];
const weddingStatuses = [
  'DRAFT',
  'PLANNING',
  'BOOKING_VENDORS',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
];
const bookingStatuses = [
  'PENDING_AGREEMENT',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];
const taskStatuses = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'BLOCKED',
  'AWAITING_INFORMATION',
  'AWAITING_APPROVAL',
  'COMPLETED',
  'OVERDUE',
];
const taskPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const memberRoles = [
  'WEDDING_OWNER',
  'BUDGET_MANAGER',
  'VENDOR_COORDINATOR',
  'GUEST_MANAGER',
  'CATERING_COORDINATOR',
  'SHOPPING_COORDINATOR',
  'TRANSPORT_COORDINATOR',
  'EVENT_DAY_COORDINATOR',
];

const firstNames = [
  'Aiza',
  'Hania',
  'Maham',
  'Zara',
  'Mishal',
  'Noor',
  'Rida',
  'Sana',
  'Laiba',
  'Anaya',
  'Hammad',
  'Saad',
  'Daniyal',
  'Rayyan',
  'Sameer',
  'Hamza',
  'Arsalan',
  'Taimoor',
];
const lastNames = [
  'Khan',
  'Ahmed',
  'Raza',
  'Malik',
  'Sheikh',
  'Qureshi',
  'Mirza',
  'Siddiqui',
  'Awan',
  'Gillani',
  'Butt',
  'Chaudhry',
];
const vendorPrefixes = [
  'Noor',
  'Mehfil',
  'Zar',
  'Sunehri',
  'Riwaaj',
  'Aangan',
  'Gul',
  'Moti',
  'Shehnai',
  'Roshni',
  'Rang',
  'Mehr',
];
const vendorSuffixes = [
  'Studio',
  'Collective',
  'House',
  'Atelier',
  'Events',
  'Works',
  'Company',
  'Designs',
  'Co.',
  'Makers',
];

const imagePools = {
  venue: [
    'photo-1519167758481-83f550bb49b3',
    'photo-1464366400600-7168b8af9bc3',
    'photo-1511795409834-ef04bbd61622',
  ],
  food: [
    'photo-1555244162-803834f70033',
    'photo-1544025162-d76694265947',
    'photo-1600891964599-f61ba0e24092',
  ],
  photo: [
    'photo-1519741497674-611481863552',
    'photo-1520854221256-17451cc331bf',
    'photo-1505932794465-147d1f1b2c97',
  ],
  decor: [
    'photo-1523438885200-e635ba2c371e',
    'photo-1519225421980-715cb0215aed',
    'photo-1469371670807-013ccf25f16a',
  ],
  makeup: [
    'photo-1487412947147-5cebf100ffc2',
    'photo-1522335789203-aabd1fc54bc9',
    'photo-1516975080664-ed2fc6a32937',
  ],
  floral: [
    'photo-1504196606672-aef5c9cefc92',
    'photo-1490750967868-88aa4486c946',
    'photo-1487070183336-b863922373d4',
  ],
  fashion: [
    'photo-1469334031218-e382a71b716b',
    'photo-1496747611176-843222e1e57c',
    'photo-1483985988355-763728e1935b',
  ],
  transport: [
    'photo-1511919884226-fd3cad34687c',
    'photo-1503376780353-7e6692767b70',
    'photo-1542362567-b07e54358753',
  ],
  hotel: [
    'photo-1566073771259-6a8506099945',
    'photo-1551882547-ff40c63fe5fa',
    'photo-1520250497591-112f2f40a3f4',
  ],
  travel: [
    'photo-1507525428034-b723cf961d3e',
    'photo-1500530855697-b586d89ba3ee',
    'photo-1493558103817-58b2924bce98',
  ],
  gift: [
    'photo-1513201099705-a9746e1e201f',
    'photo-1549465220-1a8b9238cd48',
    'photo-1512909006721-3d6018887383',
  ],
  music: [
    'photo-1516280440614-37939bbacd81',
    'photo-1501386761578-eac5c94b800a',
    'photo-1458560871784-56d23406c091',
  ],
  print: [
    'photo-1586953208448-b95a79798f07',
    'photo-1516321318423-f06f85e504b3',
    'photo-1516387938699-a93567ec168e',
  ],
  planning: [
    'photo-1511795409834-ef04bbd61622',
    'photo-1527529482837-4698179dc6ce',
    'photo-1478146896981-b80fe463b330',
  ],
};

function datePlus(days, hour = 12) {
  const date = new Date(BASE_DATE);
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
}

function pick(list, index) {
  return list[index % list.length];
}

function money(value) {
  return Math.round(value / 1000) * 1000;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function unsplash(kind, index, width = 1200, height = 800) {
  const pool = imagePools[kind] || imagePools.decor;
  const id = pick(pool, index);
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&h=${height}&q=82`;
}

function avatar(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6E1738&color=FFF9F3&bold=true&format=svg`;
}

async function resetDemoData() {
  await prisma.auditLog.deleteMany();
  await prisma.activityEvent.deleteMany();
  await prisma.message.deleteMany();
  await prisma.messageThread.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.vendorTrustSignal.deleteMany();
  await prisma.bookingDispute.deleteMany();
  await prisma.vendorReview.deleteMany();
  await prisma.bookingPayment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.proposalComment.deleteMany();
  await prisma.proposalVersion.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.serviceRequestMatch.deleteMany();
  await prisma.serviceRequestInvitation.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.vendorInquiry.deleteMany();
  await prisma.vendorAvailability.deleteMany();
  await prisma.vendorTeam.deleteMany();
  await prisma.servicePackage.deleteMany();
  await prisma.serviceListing.deleteMany();
  await prisma.vendorPortfolio.deleteMany();
  await prisma.vendorVerification.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.taskStatusHistory.deleteMany();
  await prisma.taskBlocker.deleteMany();
  await prisma.taskReminder.deleteMany();
  await prisma.taskApproval.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.taskEvidence.deleteMany();
  await prisma.taskAssignment.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.taskStep.deleteMany();
  await prisma.weddingTask.deleteMany();
  await prisma.budgetItem.deleteMany();
  await prisma.weddingPlan.deleteMany();
  await prisma.guest.deleteMany();
  await prisma.weddingEvent.deleteMany();
  await prisma.weddingMember.deleteMany();
  await prisma.wedding.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.emailVerificationToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.role.deleteMany();
}

async function attachRole(userId, name) {
  const role = await prisma.role.findUnique({ where: { name } });
  if (!role) return;
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId: role.id } },
    update: {},
    create: { userId, roleId: role.id },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  await resetDemoData();

  await prisma.role.createMany({
    data: roles.map((name) => ({
      name,
      description: `${name.replaceAll('_', ' ').toLowerCase()} role`,
    })),
  });

  await prisma.serviceCategory.createMany({
    data: categorySpecs.map(([name, description, slug]) => ({
      name,
      description,
      slug,
    })),
  });
  const categories = await prisma.serviceCategory.findMany();
  const categoryBySlug = new Map(
    categories.map((category) => [category.slug, category]),
  );

  const admin = await prisma.user.create({
    data: {
      id: 'demo-admin-user',
      email: 'admin@rasmbazaar.test',
      passwordHash,
      fullName: 'Demo Admin',
      phone: '+920000000001',
      city: 'Lahore',
      isEmailVerified: true,
      profile: {
        create: {
          bio: 'Demo admin for review workflows.',
          avatarUrl: avatar('Demo Admin'),
        },
      },
    },
  });
  await attachRole(admin.id, 'ADMIN');

  const customers = [];
  for (let i = 0; i < 15; i += 1) {
    const fullName = `${pick(firstNames, i)} ${pick(lastNames, i + 3)}`;
    const user = await prisma.user.create({
      data: {
        id: `demo-customer-${i + 1}`,
        email:
          i === 0
            ? 'customer@rasmbazaar.test'
            : `customer${i + 1}@rasmbazaar.test`,
        passwordHash,
        fullName,
        phone: `+9200001${String(i + 1).padStart(5, '0')}`,
        city: pick(cities, i),
        isEmailVerified: true,
        profile: {
          create: {
            bio: 'Fictional customer account for demo weddings.',
            avatarUrl: avatar(fullName),
          },
        },
      },
    });
    await attachRole(user.id, 'CUSTOMER');
    await attachRole(user.id, 'WEDDING_OWNER');
    customers.push(user);
  }

  const vendors = [];
  let vendorIndex = 0;
  for (const [categoryName, , slug, imageKind, basePrice] of categorySpecs) {
    for (let local = 0; local < 4; local += 1) {
      const businessName = `${pick(vendorPrefixes, vendorIndex)} ${categoryName.replace(/s$/, '')} ${pick(vendorSuffixes, vendorIndex + local)}`;
      const ownerName = `${pick(firstNames, vendorIndex + 8)} ${pick(lastNames, vendorIndex + 2)}`;
      const user = await prisma.user.create({
        data: {
          id: `demo-vendor-user-${vendorIndex + 1}`,
          email:
            vendorIndex === 0
              ? 'vendor@rasmbazaar.test'
              : `vendor${vendorIndex + 1}@rasmbazaar.test`,
          passwordHash,
          fullName: ownerName,
          phone: `+9200002${String(vendorIndex + 1).padStart(5, '0')}`,
          city: pick(cities, vendorIndex + local),
          isEmailVerified: true,
          profile: {
            create: {
              bio: `Owner of ${businessName}. Fictional account.`,
              avatarUrl: avatar(businessName),
            },
          },
        },
      });
      await attachRole(user.id, 'VENDOR_OWNER');

      const city = pick(cities, vendorIndex + local);
      const verificationStatus =
        vendorIndex % 17 === 0
          ? 'SUSPENDED'
          : vendorIndex % 9 === 0
            ? 'PENDING'
            : 'APPROVED';
      const vendor = await prisma.vendor.create({
        data: {
          id: `demo-vendor-${vendorIndex + 1}`,
          userId: user.id,
          businessName,
          ownerName,
          description: `${businessName} is a fictional ${categoryName.toLowerCase()} provider for RasmBazaar demo data, serving premium desi weddings with clear packages, responsive coordination, and family-friendly service.`,
          phone: `+9200002${String(vendorIndex + 1).padStart(5, '0')}`,
          email: user.email,
          address: `Demo Office ${vendorIndex + 1}, ${city}`,
          city,
          serviceAreas: [
            city,
            pick(cities, vendorIndex + 1),
            pick(cities, vendorIndex + 2),
          ],
          yearsOfExperience: 2 + (vendorIndex % 14),
          teamSize: 3 + (vendorIndex % 18),
          startingPrice: money(basePrice * (0.85 + local * 0.18)),
          verificationStatus,
          verificationLevel:
            vendorIndex % 7 === 0
              ? 'PLATFORM_TRUSTED'
              : vendorIndex % 3 === 0
                ? 'BUSINESS_VERIFIED'
                : 'IDENTITY_VERIFIED',
          isActive: verificationStatus !== 'SUSPENDED',
        },
      });
      vendors.push({
        ...vendor,
        categorySlug: slug,
        categoryName,
        imageKind,
        basePrice,
      });
      vendorIndex += 1;
    }
  }

  const serviceListings = [];
  const packages = [];
  const portfolios = [];
  const teams = [];
  const availability = [];
  const verifications = [];

  vendors.forEach((vendor, index) => {
    const category = categoryBySlug.get(vendor.categorySlug);
    const serviceId = `demo-service-${index + 1}`;
    serviceListings.push({
      id: serviceId,
      vendorId: vendor.id,
      categoryId: category?.id,
      title: `${vendor.categoryName} Signature Service`,
      description: `Detailed ${vendor.categoryName.toLowerCase()} service with planning support, setup coordination, and a dedicated point of contact.`,
      pricingModel:
        vendor.categorySlug === 'catering'
          ? 'PER_GUEST'
          : index % 4 === 0
            ? 'FIXED'
            : 'STARTING_FROM',
      startingPrice: vendor.startingPrice,
      serviceAreas: vendor.serviceAreas,
      capacity: 80 + (index % 12) * 70,
      inclusions: [
        'Planning call',
        'Dedicated coordinator',
        'Event-day support',
        'Standard setup',
      ],
      exclusions: ['Venue rental', 'Government permissions', 'Generator fuel'],
      addOns: ['Premium upgrade', 'Extra team member', 'Late-night extension'],
      leadTimeDays: 7 + (index % 28),
      cancellationPolicy:
        'Advance can be adjusted to another date if informed at least 14 days before the event.',
    });

    ['Essential', 'Signature', 'Premium', 'Royal'].forEach(
      (tier, tierIndex) => {
        packages.push({
          id: `demo-package-${index + 1}-${tierIndex + 1}`,
          vendorId: vendor.id,
          serviceId,
          name: `${tier} ${vendor.categoryName} Package`,
          description: `${tier} tier package for fictional demo weddings with transparent inclusions and add-ons.`,
          price: money(Number(vendor.startingPrice) * (1 + tierIndex * 0.34)),
          includedItems: [
            'Consultation',
            'Core service delivery',
            'Event-day coordination',
            tierIndex > 1 ? 'Premium styling' : 'Standard styling',
          ],
          excludedItems: [
            'Venue charges',
            'Security deposits',
            'Third-party permissions',
          ],
          addOns: ['Extra hour', 'Premium materials', 'Additional team unit'],
          eventCoverage:
            tierIndex < 2
              ? 'One event up to six hours'
              : 'Two events with extended coverage',
          teamSize: 2 + tierIndex,
          deliveryTimeline:
            tierIndex < 2
              ? 'Delivery within 14 days'
              : 'Priority delivery within 7 days',
        });
      },
    );

    for (let p = 0; p < 8; p += 1) {
      portfolios.push({
        id: `demo-portfolio-${index + 1}-${p + 1}`,
        vendorId: vendor.id,
        title: `${vendor.categoryName} portfolio ${p + 1}`,
        imageUrl: unsplash(vendor.imageKind, index + p),
        description: `Fictional ${vendor.categoryName.toLowerCase()} portfolio image for demo presentation.`,
        isFeatured: p < 3,
        sortOrder: p + 1,
      });
    }

    teams.push({
      id: `demo-team-${index + 1}`,
      vendorId: vendor.id,
      name: `${vendor.businessName} Team ${index % 3 === 0 ? 'A' : index % 3 === 1 ? 'B' : 'Prime'}`,
      description: 'Fictional event team for availability and booking demos.',
      capacity: 1 + (index % 3),
    });

    for (let a = 0; a < 6; a += 1) {
      availability.push({
        id: `demo-availability-${index + 1}-${a + 1}`,
        vendorId: vendor.id,
        teamId: `demo-team-${index + 1}`,
        date: datePlus(12 + a * 7 + (index % 5), 0),
        startTime: '16:00',
        endTime: '23:30',
        capacity: 1 + (index % 2),
        status: pick(
          [
            'AVAILABLE',
            'AVAILABLE',
            'PARTIALLY_AVAILABLE',
            'TENTATIVELY_RESERVED',
            'BOOKED',
          ],
          index + a,
        ),
        notes: pick(
          [
            'Open for evening event.',
            'Morning setup possible.',
            'Second team available.',
            'Advance required to hold date.',
          ],
          index + a,
        ),
      });
    }

    verifications.push({
      id: `demo-verification-${index + 1}`,
      vendorId: vendor.id,
      documentType: 'BUSINESS_REGISTRATION',
      documentUrl: `https://example.com/demo-documents/vendor-${index + 1}-registration.pdf`,
      notes: 'Fictional verification document. No real business data.',
      status: index % 9 === 0 ? 'PENDING' : 'APPROVED',
      reviewedById: index % 9 === 0 ? null : admin.id,
      reviewedAt: index % 9 === 0 ? null : datePlus(-30 + (index % 20)),
      reviewComment:
        index % 9 === 0
          ? null
          : 'Demo verification approved for marketplace presentation.',
    });
  });

  await prisma.serviceListing.createMany({ data: serviceListings });
  await prisma.servicePackage.createMany({ data: packages });
  await prisma.vendorPortfolio.createMany({ data: portfolios });
  await prisma.vendorTeam.createMany({ data: teams });
  await prisma.vendorAvailability.createMany({ data: availability });
  await prisma.vendorVerification.createMany({ data: verifications });

  const weddings = [];
  const weddingEvents = [];
  const weddingMembers = [];
  const guests = [];
  const budgetItems = [];
  const plans = [];
  const tasks = [];
  const taskSteps = [];
  const taskAssignments = [];
  const taskEvidence = [];
  const taskComments = [];
  const taskApprovals = [];
  const taskReminders = [];
  const taskBlockers = [];
  const taskHistory = [];

  const budgetCategories = [
    'Venue',
    'Catering',
    'Photography',
    'Decor',
    'Makeup',
    'Transport',
    'Bridal Wear',
    'Jewellery',
    'Invitation',
    'Gifts',
    'Music',
    'Contingency',
  ];
  const taskTitles = [
    'Confirm event flow with family',
    'Shortlist three vendors',
    'Review proposal comparison',
    'Lock final guest count',
    'Confirm menu tasting',
    'Approve stage moodboard',
    'Collect payment receipt',
    'Share arrival timing with vendor',
    'Confirm bridal prep schedule',
    'Arrange transport for elders',
    'Prepare emergency contact sheet',
    'Confirm final seating plan',
    'Check sound and lighting plan',
    'Review photography shot list',
    'Pack ceremony essentials',
    'Confirm hotel rooms',
    'Review vendor agreement',
    'Finalize decor color palette',
    'Confirm invitation dispatch',
    'Prepare wedding-day run sheet',
    'Check weather backup plan',
    'Confirm dhol arrival',
    'Review budget variance',
    'Approve final payment schedule',
    'Confirm gift table setup',
  ];

  for (let i = 0; i < 12; i += 1) {
    const bride = pick(firstNames, i + 1);
    const groom = pick(firstNames, i + 11);
    const owner = customers[i % customers.length];
    const budget = [950000, 1800000, 3200000, 5200000, 8500000][i % 5];
    const wedding = {
      id: `demo-wedding-${i + 1}`,
      title: `${bride} and ${groom} Wedding`,
      brideName: bride,
      groomName: groom,
      city: pick(cities, i),
      estimatedBudget: budget,
      estimatedGuestCount: 120 + (i % 8) * 80,
      startDate: datePlus(20 + i * 9, 0),
      endDate: datePlus(23 + i * 9, 0),
      mainCoordinator: `${pick(firstNames, i + 4)} ${pick(lastNames, i + 5)}`,
      notes:
        'Fictional demo wedding with active planning, vendors, guests, budget, and day-of operations.',
      status: pick(weddingStatuses, i),
      ownerId: owner.id,
    };
    weddings.push(wedding);
    plans.push({
      id: `demo-plan-${i + 1}`,
      weddingId: wedding.id,
      status: 'ACTIVE',
      summary: { progress: 35 + (i % 6) * 9, source: 'demo-seed' },
    });
    weddingMembers.push({
      id: `demo-member-owner-${i + 1}`,
      weddingId: wedding.id,
      userId: owner.id,
      email: owner.email,
      fullName: owner.fullName,
      role: 'WEDDING_OWNER',
      status: 'ACCEPTED',
      acceptedAt: datePlus(-20 + i),
    });

    for (let m = 0; m < 5; m += 1) {
      weddingMembers.push({
        id: `demo-member-${i + 1}-${m + 1}`,
        weddingId: wedding.id,
        email: `family${i + 1}-${m + 1}@rasmbazaar.test`,
        fullName: `${pick(firstNames, i + m + 2)} ${pick(lastNames, i + m)}`,
        role: pick(memberRoles, m + 1),
        status: m === 4 ? 'INVITED' : 'ACCEPTED',
        acceptedAt: m === 4 ? null : datePlus(-18 + m),
      });
    }

    eventTypes.forEach((eventType, e) => {
      weddingEvents.push({
        id: `demo-event-${i + 1}-${e + 1}`,
        weddingId: wedding.id,
        name: `${eventType} ${e === 0 ? 'Night' : e === 1 ? 'Ceremony' : e === 2 ? 'Reception' : 'Dinner'}`,
        eventType,
        date: datePlus(20 + i * 9 + e, 0),
        startTime: e === 1 ? '11:00' : '18:30',
        endTime: e === 1 ? '14:00' : '23:30',
        venue: pick(
          [
            'Gulberg Marquee',
            'Seaview Lawn',
            'Capital Banquet',
            'Royal Palm Hall',
            'Family Residence',
            'Pearl Garden',
          ],
          i + e,
        ),
        city: wedding.city,
        guestCount: Math.max(80, wedding.estimatedGuestCount - e * 30),
        eventBudget: money(budget * [0.18, 0.12, 0.34, 0.28][e]),
        dressCode: pick(
          [
            'Pastel festive',
            'Ivory and gold',
            'Traditional formal',
            'Emerald and maroon',
          ],
          i + e,
        ),
        notes: `Demo ${eventType} event timeline and vendor coordination.`,
        assignedCoordinator: `${pick(firstNames, i + e + 6)} ${pick(lastNames, i + e + 2)}`,
      });
    });

    for (let g = 0; g < 36; g += 1) {
      const family = `${pick(lastNames, i + g)} Family`;
      guests.push({
        id: `demo-guest-${i + 1}-${g + 1}`,
        weddingId: wedding.id,
        name:
          g % 5 === 0
            ? family
            : `${pick(firstNames, g + i)} ${pick(lastNames, g)}`,
        relation: pick(
          [
            'Bride side',
            'Groom side',
            'Office friends',
            'University friends',
            'Family elders',
            'Neighbours',
          ],
          g,
        ),
        phone: `+9200003${String(i * 100 + g + 1).padStart(5, '0')}`,
        status: pick(
          ['CONFIRMED', 'CONFIRMED', 'INVITED', 'PENDING', 'DECLINED'],
          g + i,
        ),
      });
    }

    budgetCategories.forEach((category, b) => {
      const amount = money((budget / 12) * (0.65 + (b % 5) * 0.18));
      budgetItems.push({
        id: `demo-budget-${i + 1}-${b + 1}`,
        weddingId: wedding.id,
        title: `${category} ${b % 4 === 0 ? 'advance' : b % 4 === 1 ? 'estimate' : b % 4 === 2 ? 'final payment' : 'buffer'}`,
        category,
        amount: b === 3 && i % 4 === 0 ? money(amount * 1.28) : amount,
        dueDate: datePlus(5 + b * 3 + i),
        isPaid: b < i % 7,
        notes:
          b === 3 && i % 4 === 0
            ? 'Demo overspent category for budget analytics.'
            : 'Demo budget line item.',
      });
    });

    for (let t = 0; t < 26; t += 1) {
      const status = pick(taskStatuses, t + i);
      const taskId = `demo-task-${i + 1}-${t + 1}`;
      tasks.push({
        id: taskId,
        weddingId: wedding.id,
        eventId: `demo-event-${i + 1}-${(t % 4) + 1}`,
        title: taskTitles[t % taskTitles.length],
        description:
          'Demo planner task with ownership, deadline, evidence, approval, reminders, and status history.',
        whyImportant:
          'Keeps family coordination clear and reduces last-minute confusion.',
        instructions: [
          'Confirm owner',
          'Collect vendor update',
          'Mark completion with evidence',
        ],
        category: pick(
          ['Budget', 'Vendors', 'Guests', 'Events', 'Shopping', 'Logistics'],
          t,
        ),
        assignedUserId: null,
        assignedRole: pick(memberRoles, t),
        assignee: `${pick(firstNames, i + t)} ${pick(lastNames, t)}`,
        startDate: datePlus(-20 + t + i),
        dueDate: datePlus(-6 + t + i),
        priority: pick(taskPriorities, t + i),
        status,
        requiredEvidence:
          t % 3 === 0 ? ['Receipt', 'Screenshot or document'] : [],
        completionCriteria:
          'Task owner confirms and uploads required evidence if applicable.',
        requiresApproval: t % 5 === 0,
        approvalStatus:
          t % 5 === 0
            ? pick(['PENDING', 'APPROVED', 'REJECTED'], t)
            : 'NOT_REQUIRED',
        isCompleted: status === 'COMPLETED',
      });
      taskSteps.push(
        {
          id: `${taskId}-step-1`,
          taskId,
          title: 'Confirm details',
          sortOrder: 1,
          isDone: ['IN_PROGRESS', 'COMPLETED'].includes(status),
        },
        {
          id: `${taskId}-step-2`,
          taskId,
          title: 'Share update with family',
          sortOrder: 2,
          isDone: status === 'COMPLETED',
        },
      );
      taskAssignments.push({
        id: `${taskId}-assignment`,
        taskId,
        role: pick(memberRoles, t),
        assigneeName: `${pick(firstNames, i + t)} ${pick(lastNames, t)}`,
      });
      taskReminders.push({
        id: `${taskId}-reminder`,
        taskId,
        remindAt: datePlus(-2 + t + i),
        status: t % 4 === 0 ? 'SENT' : 'SCHEDULED',
      });
      taskHistory.push({
        id: `${taskId}-history`,
        taskId,
        fromStatus: 'NOT_STARTED',
        toStatus: status,
        note: 'Demo status progression.',
      });
      if (t % 4 === 0) {
        taskEvidence.push({
          id: `${taskId}-evidence`,
          taskId,
          uploadedById: owner.id,
          title: 'Demo evidence upload',
          fileUrl: `https://example.com/demo-evidence/${taskId}.pdf`,
          fileType: 'application/pdf',
          notes: 'Fictional evidence file.',
        });
      }
      if (t % 5 === 0) {
        taskApprovals.push({
          id: `${taskId}-approval`,
          taskId,
          reviewerId: owner.id,
          status: pick(['PENDING', 'APPROVED', 'REJECTED'], t),
          comment: 'Demo approval workflow note.',
          decidedAt: t % 2 === 0 ? datePlus(-1 + t) : null,
        });
      }
      if (status === 'BLOCKED') {
        taskBlockers.push({
          id: `${taskId}-blocker`,
          taskId,
          blockerType: 'Vendor dependency',
          reason: 'Waiting for vendor confirmation',
          description: 'Demo blocker showing planning risk.',
          responsiblePerson: 'Vendor coordinator',
          expectedResolutionDate: datePlus(3 + t),
          status: 'OPEN',
        });
      }
      if (t % 6 === 0) {
        taskComments.push({
          id: `${taskId}-comment`,
          taskId,
          authorId: owner.id,
          comment: 'Please update the family group once this is confirmed.',
        });
      }
    }
  }

  await prisma.wedding.createMany({ data: weddings });
  await prisma.weddingPlan.createMany({ data: plans });
  await prisma.weddingMember.createMany({ data: weddingMembers });
  await prisma.weddingEvent.createMany({ data: weddingEvents });
  await prisma.guest.createMany({ data: guests });
  await prisma.budgetItem.createMany({ data: budgetItems });
  await prisma.weddingTask.createMany({ data: tasks });
  await prisma.taskStep.createMany({ data: taskSteps });
  await prisma.taskAssignment.createMany({ data: taskAssignments });
  await prisma.taskEvidence.createMany({ data: taskEvidence });
  await prisma.taskComment.createMany({ data: taskComments });
  await prisma.taskApproval.createMany({ data: taskApprovals });
  await prisma.taskReminder.createMany({ data: taskReminders });
  await prisma.taskBlocker.createMany({ data: taskBlockers });
  await prisma.taskStatusHistory.createMany({ data: taskHistory });

  const serviceRequests = [];
  const invitations = [];
  const matches = [];
  const proposals = [];
  const proposalVersions = [];
  const proposalComments = [];
  const bookings = [];
  const bookingPayments = [];
  const bookingDisputes = [];
  const reviews = [];
  const threads = [];
  const messages = [];
  const notifications = [];
  const activities = [];
  const inquiries = [];

  const requestCount = 216;
  for (let r = 0; r < requestCount; r += 1) {
    const wedding = weddings[r % weddings.length];
    const owner = customers[r % customers.length];
    const categorySpec = categorySpecs[r % categorySpecs.length];
    const category = categoryBySlug.get(categorySpec[2]);
    const eventId = `demo-event-${(r % weddings.length) + 1}-${(r % 4) + 1}`;
    const requestId = `demo-request-${r + 1}`;
    const maxBudget = money(categorySpec[4] * (1.8 + (r % 5) * 0.32));
    serviceRequests.push({
      id: requestId,
      customerId: owner.id,
      weddingId: wedding.id,
      eventId,
      categoryId: category?.id,
      title: `${pick(eventTypes, r)} ${categorySpec[0]} requirement`,
      city: wedding.city,
      venue: pick(
        [
          'Gulberg Marquee',
          'Seaview Lawn',
          'Capital Banquet',
          'Royal Palm Hall',
          'Family Residence',
          'Pearl Garden',
        ],
        r,
      ),
      eventDate: datePlus(18 + (r % 90)),
      startTime: r % 3 === 0 ? '11:00' : '19:00',
      guestCount: 120 + (r % 8) * 75,
      minBudget: money(maxBudget * 0.72),
      maxBudget,
      description: `Fictional requirement for ${categorySpec[0].toLowerCase()} with clear deliverables, event timing, family expectations, and proposal comparison data.`,
      deliverables: [
        'Itemized quote',
        'Setup timeline',
        'Team details',
        'Payment schedule',
      ],
      attachments: [unsplash(categorySpec[3], r, 900, 600)],
      proposalDeadline: datePlus(5 + (r % 18)),
      visibility: r % 8 === 0 ? 'INVITE_ONLY' : 'PUBLIC_TO_MATCHING_VENDORS',
      status:
        r % 5 === 0
          ? 'SHORTLISTING'
          : r % 7 === 0
            ? 'RECEIVING_PROPOSALS'
            : 'AWARDED',
    });

    const matchingVendors = vendors
      .filter((vendor) => vendor.categorySlug === categorySpec[2])
      .slice(0, 4);
    const proposalVendors = matchingVendors.length
      ? matchingVendors
      : vendors.slice(r % vendors.length, (r % vendors.length) + 4);
    proposalVendors.slice(0, 3).forEach((vendor, p) => {
      invitations.push({
        id: `demo-invitation-${r + 1}-${p + 1}`,
        serviceRequestId: requestId,
        vendorId: vendor.id,
        status: p === 0 ? 'RESPONDED' : 'VIEWED',
        note: 'Demo invitation generated for vendor comparison.',
      });
      matches.push({
        id: `demo-match-${r + 1}-${p + 1}`,
        serviceRequestId: requestId,
        vendorId: vendor.id,
        score: 92 - p * 8 - (r % 5),
        reasons: [
          'Matches city',
          'Fits budget range',
          'Relevant portfolio',
          'Strong response time',
        ],
      });
      const proposalId = `demo-proposal-${r + 1}-${p + 1}`;
      const versionId = `demo-proposal-version-${r + 1}-${p + 1}`;
      const accepted = p === 0;
      proposals.push({
        id: proposalId,
        serviceRequestId: requestId,
        vendorId: vendor.id,
        status: accepted ? 'ACCEPTED' : p === 1 ? 'SHORTLISTED' : 'SUBMITTED',
        latestVersionId: versionId,
        customerNote:
          p === 2
            ? 'Please confirm if late-night extension is possible.'
            : null,
        shortlistedAt: p < 2 ? datePlus(-5 + (r % 10)) : null,
        acceptedAt: accepted ? datePlus(-3 + (r % 8)) : null,
      });
      const price = money(
        Number(vendor.startingPrice) * (1.15 + p * 0.16 + (r % 4) * 0.08),
      );
      proposalVersions.push({
        id: versionId,
        proposalId,
        versionNumber: 1,
        totalPrice: price,
        packageDescription: `${vendor.businessName} structured quotation for ${categorySpec[0].toLowerCase()} demo requirement.`,
        inclusions: [
          'Planning call',
          'Event-day team',
          'Standard setup',
          'Coordinator support',
        ],
        exclusions: [
          'Venue rental',
          'Generator fuel',
          'Government permissions',
        ],
        addOns: ['Premium upgrade', 'Extra hour', 'Additional team member'],
        teamSize: 2 + (p % 4),
        setupTime:
          p === 0 ? '4 hours before guest arrival' : '3 hours before event',
        deliveryTime: 'Event coverage as per agreed timeline',
        advanceAmount: money(price * 0.3),
        paymentSchedule: '30% advance, 50% before event, 20% after completion.',
        cancellationPolicy:
          'Advance adjustable if date changes at least 14 days before event.',
        validityDate: datePlus(20 + (r % 20)),
        terms: 'Final details and headcount lock seven days before event.',
        attachments: [unsplash(categorySpec[3], r + p, 900, 600)],
      });
      if (p === 1 && r % 4 === 0) {
        proposalComments.push({
          id: `demo-proposal-comment-${r + 1}`,
          proposalId,
          authorId: owner.id,
          authorRole: 'CUSTOMER',
          comment:
            'Can you share a revised option with a smaller advance amount?',
        });
      }
    });

    const acceptedVendor = proposalVendors[0];
    const acceptedPrice = money(
      Number(acceptedVendor.startingPrice) * (1.22 + (r % 4) * 0.08),
    );
    const bookingStatus = pick(bookingStatuses, r);
    const bookingId = `demo-booking-${r + 1}`;
    bookings.push({
      id: bookingId,
      proposalId: `demo-proposal-${r + 1}-1`,
      serviceRequestId: requestId,
      weddingId: wedding.id,
      eventId,
      customerId: owner.id,
      vendorId: acceptedVendor.id,
      title: `${acceptedVendor.businessName} - ${categorySpec[0]} booking`,
      status: bookingStatus,
      totalAmount: acceptedPrice,
      agreementText: `Demo agreement for ${categorySpec[0]}.\nVendor: ${acceptedVendor.businessName}\nPayment schedule: 30% advance, 50% before event, 20% after completion.`,
      agreedAt:
        bookingStatus === 'PENDING_AGREEMENT' ? null : datePlus(-4 + (r % 7)),
      customerConfirmedAt: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(
        bookingStatus,
      )
        ? datePlus(-4 + (r % 7))
        : null,
      vendorConfirmedAt: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(
        bookingStatus,
      )
        ? datePlus(-3 + (r % 7))
        : null,
      startsAt: datePlus(18 + (r % 90), r % 3 === 0 ? 11 : 19),
      endsAt: datePlus(18 + (r % 90), 23),
      cancellationReason:
        bookingStatus === 'CANCELLED'
          ? 'Demo cancellation after family changed event scope.'
          : null,
    });
    bookingPayments.push(
      {
        id: `${bookingId}-payment-1`,
        bookingId,
        title: 'Advance payment',
        amount: money(acceptedPrice * 0.3),
        dueDate: datePlus(-2 + (r % 10)),
        status: r % 5 === 0 ? 'OVERDUE' : 'PAID',
        method: r % 5 === 0 ? null : 'BANK_TRANSFER',
        reference: `DEMO-ADV-${r + 1}`,
        paidAt: r % 5 === 0 ? null : datePlus(-2 + (r % 8)),
      },
      {
        id: `${bookingId}-payment-2`,
        bookingId,
        title: 'Pre-event milestone',
        amount: money(acceptedPrice * 0.5),
        dueDate: datePlus(8 + (r % 20)),
        status: r % 4 === 0 ? 'DUE' : 'PENDING',
        reference: `DEMO-MID-${r + 1}`,
      },
      {
        id: `${bookingId}-payment-3`,
        bookingId,
        title: 'Final payment',
        amount: money(acceptedPrice * 0.2),
        dueDate: datePlus(18 + (r % 30)),
        status: bookingStatus === 'COMPLETED' ? 'PAID' : 'PENDING',
        method: bookingStatus === 'COMPLETED' ? 'CASH' : null,
        reference: `DEMO-FINAL-${r + 1}`,
        paidAt: bookingStatus === 'COMPLETED' ? datePlus(20 + (r % 20)) : null,
      },
    );
    if (r % 17 === 0) {
      bookingDisputes.push({
        id: `${bookingId}-dispute`,
        bookingId,
        vendorId: acceptedVendor.id,
        customerId: owner.id,
        openedById: owner.id,
        reason: 'Timeline clarification',
        details: 'Fictional dispute note for demo admin review.',
        status: r % 2 === 0 ? 'RESOLVED' : 'UNDER_REVIEW',
        resolutionNote:
          r % 2 === 0 ? 'Resolved after updated event timeline.' : null,
        resolvedAt: r % 2 === 0 ? datePlus(3 + (r % 10)) : null,
      });
    }
    if (bookingStatus === 'COMPLETED' || r < 205) {
      reviews.push({
        id: `${bookingId}-review`,
        bookingId,
        vendorId: acceptedVendor.id,
        customerId: owner.id,
        rating: 4 + (r % 5 === 0 ? 0 : 1),
        communicationRating: 4 + (r % 3 === 0 ? 0 : 1),
        qualityRating: 4 + (r % 4 === 0 ? 0 : 1),
        valueRating: 4 + (r % 6 === 0 ? 0 : 1),
        professionalismRating: 4 + (r % 5 === 0 ? 0 : 1),
        title: pick(
          [
            'Organized and responsive',
            'Beautiful event execution',
            'Family-friendly team',
            'Clear communication',
            'Reliable service',
          ],
          r,
        ),
        comment: pick(
          [
            'The fictional team communicated clearly, arrived on time, and kept the family updated throughout the event.',
            'Great demo experience with transparent pricing and smooth coordination.',
            'The vendor handled last-minute changes professionally and kept the event moving.',
            'Quality was strong for the package and the team was respectful with family guests.',
          ],
          r,
        ),
        wouldRecommend: r % 11 !== 0,
        tags: [
          'responsive',
          'organized',
          pick(['premium', 'punctual', 'family-friendly', 'creative'], r),
        ],
        status: r % 29 === 0 ? 'FLAGGED' : 'PUBLISHED',
        visibility: 'PUBLIC',
        vendorResponse:
          r % 3 === 0
            ? 'Thank you for the kind demo feedback. We loved supporting the celebration.'
            : null,
        vendorRespondedAt: r % 3 === 0 ? datePlus(24 + (r % 10)) : null,
      });
    }

    if (r < 70) {
      inquiries.push({
        id: `demo-inquiry-${r + 1}`,
        vendorId: acceptedVendor.id,
        customerId: owner.id,
        weddingId: wedding.id,
        name: owner.fullName || 'Demo Customer',
        email: owner.email,
        phone: owner.phone,
        city: wedding.city,
        eventDate: datePlus(20 + (r % 60)),
        guestCount: 150 + (r % 6) * 70,
        message:
          'Please share availability, package options, and advance requirement for our event.',
        status: pick(['NEW', 'RESPONDED', 'CLOSED'], r),
      });
    }

    if (r < 80) {
      const threadId = `demo-thread-${r + 1}`;
      threads.push({
        id: threadId,
        type: 'BOOKING',
        title: `${acceptedVendor.businessName} booking discussion`,
        customerId: owner.id,
        vendorId: acceptedVendor.id,
        weddingId: wedding.id,
        bookingId,
        serviceRequestId: requestId,
        lastMessageAt: datePlus(-1 + (r % 10), 13),
      });
      messages.push(
        {
          id: `${threadId}-message-1`,
          threadId,
          senderId: owner.id,
          body: 'Please confirm setup time and final advance amount.',
          customerReadAt: datePlus(-3),
          vendorReadAt: datePlus(-3),
          createdAt: datePlus(-3, 10),
        },
        {
          id: `${threadId}-message-2`,
          threadId,
          senderId: acceptedVendor.userId,
          body: 'Setup team will arrive four hours before guest arrival. Advance is 30% as listed.',
          customerReadAt: datePlus(-2),
          vendorReadAt: datePlus(-2),
          createdAt: datePlus(-2, 11),
        },
        {
          id: `${threadId}-message-3`,
          threadId,
          senderId: owner.id,
          body: 'Confirmed. Please also keep one coordinator available for family contact.',
          customerReadAt: datePlus(-1),
          vendorReadAt: datePlus(-1),
          createdAt: datePlus(-1, 13),
        },
      );
    }

    if (r < 160) {
      notifications.push({
        id: `demo-notification-${r + 1}`,
        recipientId: owner.id,
        actorId: acceptedVendor.userId,
        type: pick(
          [
            'PROPOSAL_UPDATE',
            'BOOKING_UPDATE',
            'PAYMENT_UPDATE',
            'TASK_REMINDER',
            'MESSAGE',
          ],
          r,
        ),
        priority: pick(['LOW', 'NORMAL', 'HIGH', 'URGENT'], r),
        title: pick(
          [
            'New proposal received',
            'Booking confirmed',
            'Payment reminder',
            'Task assignment updated',
            'Vendor sent a message',
          ],
          r,
        ),
        body: 'Fictional notification generated for a realistic active dashboard.',
        actionUrl: pick(
          [
            '/customer/proposals',
            '/customer/bookings',
            `/customer/weddings/${wedding.id}/tasks`,
            '/customer/messages',
          ],
          r,
        ),
        entityType: pick(
          ['Proposal', 'Booking', 'Payment', 'WeddingTask', 'Message'],
          r,
        ),
        entityId: bookingId,
        deliveredAt: datePlus(-6 + (r % 16)),
        readAt: r % 4 === 0 ? null : datePlus(-4 + (r % 12)),
        metadata: { demo: true },
      });
    }

    if (r < 140) {
      activities.push({
        id: `demo-activity-${r + 1}`,
        actorId: r % 2 === 0 ? owner.id : acceptedVendor.userId,
        weddingId: wedding.id,
        bookingId,
        type: pick(
          ['BOOKING', 'PAYMENT', 'MESSAGE', 'TASK', 'SERVICE_REQUEST'],
          r,
        ),
        title: pick(
          [
            'Vendor arrival confirmed',
            'Payment milestone updated',
            'Proposal shortlisted',
            'Incident logged',
            'Run sheet updated',
          ],
          r,
        ),
        body: pick(
          [
            'Team arrival moved to 4:30 PM.',
            'Advance payment receipt attached.',
            'Family shortlisted this proposal.',
            'Minor delay noted and resolved.',
            'Wedding-day timeline updated.',
          ],
          r,
        ),
        entityType: 'DemoEvent',
        entityId: bookingId,
        metadata: { demo: true, eventOps: r % 9 === 0 },
      });
    }
  }

  await prisma.serviceRequest.createMany({ data: serviceRequests });
  await prisma.serviceRequestInvitation.createMany({ data: invitations });
  await prisma.serviceRequestMatch.createMany({ data: matches });
  await prisma.proposal.createMany({ data: proposals });
  await prisma.proposalVersion.createMany({ data: proposalVersions });
  await prisma.proposalComment.createMany({ data: proposalComments });
  await prisma.booking.createMany({ data: bookings });
  await prisma.bookingPayment.createMany({ data: bookingPayments });
  await prisma.bookingDispute.createMany({ data: bookingDisputes });
  await prisma.vendorReview.createMany({ data: reviews.slice(0, 216) });
  await prisma.vendorInquiry.createMany({ data: inquiries });
  await prisma.messageThread.createMany({ data: threads });
  await prisma.message.createMany({ data: messages });
  await prisma.notification.createMany({ data: notifications });
  await prisma.activityEvent.createMany({ data: activities });

  const trustSignals = [];
  vendors.forEach((vendor, index) => {
    const vendorReviews = reviews.filter(
      (review) => review.vendorId === vendor.id,
    );
    const averageRating = vendorReviews.length
      ? vendorReviews.reduce((sum, review) => sum + review.rating, 0) /
        vendorReviews.length
      : 4.5;
    trustSignals.push(
      {
        vendorId: vendor.id,
        type: 'REVIEW_SCORE',
        label: 'Average customer rating',
        score: Math.round(averageRating * 20),
        weight: 3,
        source: 'demo_reviews',
        details: `${vendorReviews.length} fictional reviews`,
      },
      {
        vendorId: vendor.id,
        type: 'COMPLETED_BOOKINGS',
        label: 'Completed platform bookings',
        score: 50 + (index % 50),
        weight: 2,
        source: 'demo_bookings',
      },
      {
        vendorId: vendor.id,
        type: 'VERIFICATION',
        label: 'Verification level',
        score: vendor.verificationLevel === 'PLATFORM_TRUSTED' ? 100 : 78,
        weight: 2,
        source: 'demo_verification',
      },
      {
        vendorId: vendor.id,
        type: 'PROFILE_COMPLETENESS',
        label: 'Profile completeness',
        score: 92,
        weight: 1,
        source: 'demo_profile',
      },
    );
  });
  await prisma.vendorTrustSignal.createMany({ data: trustSignals });

  await prisma.auditLog.create({
    data: {
      id: 'demo-audit-seed-complete',
      actorId: admin.id,
      action: 'DEMO_DATA_GENERATED',
      entityType: 'Seed',
      entityId: 'scripts/seed.cjs',
      newValue: JSON.stringify({
        weddings: weddings.length,
        vendors: vendors.length,
        serviceRequests: serviceRequests.length,
        proposals: proposals.length,
        bookings: bookings.length,
        reviews: reviews.length,
      }),
      ipAddress: '127.0.0.1',
      userAgent: 'RasmBazaar Demo Seeder',
    },
  });

  console.log('RasmBazaar demo dataset generated successfully.');
  console.table({
    users: customers.length + vendors.length + 1,
    weddings: weddings.length,
    events: weddingEvents.length,
    vendors: vendors.length,
    portfolios: portfolios.length,
    packages: packages.length,
    tasks: tasks.length,
    guests: guests.length,
    budgetItems: budgetItems.length,
    serviceRequests: serviceRequests.length,
    proposals: proposals.length,
    bookings: bookings.length,
    reviews: reviews.length,
    messages: messages.length,
    notifications: notifications.length,
  });
  console.log(`Demo password for all seeded users: ${PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
