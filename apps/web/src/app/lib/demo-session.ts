const DEMO_PASSWORD = 'Password123!';

export const demoAccounts = [
  {
    email: 'admin@rasmbazaar.test',
    roles: ['ADMIN'],
    name: 'Demo Admin',
    redirect: '/admin',
  },
  {
    email: 'vendor@rasmbazaar.test',
    roles: ['VENDOR_OWNER'],
    name: 'Demo Vendor',
    redirect: '/vendor/dashboard',
  },
  {
    email: 'customer@rasmbazaar.test',
    roles: ['CUSTOMER', 'WEDDING_OWNER'],
    name: 'Demo Customer',
    redirect: '/customer/weddings',
  },
];

export function demoLogin(email: string, password: string) {
  const account = demoAccounts.find(
    (item) => item.email.toLowerCase() === email.trim().toLowerCase(),
  );

  if (!account || password !== DEMO_PASSWORD) {
    return null;
  }

  return {
    accessToken: `demo-access-token-${account.email}`,
    refreshToken: `demo-refresh-token-${account.email}`,
    user: {
      id: `demo-${account.roles[0].toLowerCase()}`,
      email: account.email,
      fullName: account.name,
      roles: account.roles,
    },
    redirect: account.redirect,
  };
}

export const demoVendorDashboard = {
  vendor: {
    businessName: 'Noor Wedding Halls Studio',
    verificationLevel: 'PLATFORM_TRUSTED',
  },
  metrics: {
    verificationLevel: 'PLATFORM_TRUSTED',
    activeServices: 4,
    activePackages: 8,
    teams: 3,
    trustScore: 94,
    averageRating: 4.9,
    reviewCount: 42,
    openDisputes: 0,
  },
};

export const demoWeddings = [
  {
    id: 'demo-wedding-1',
    title: 'Aiza & Hamza Wedding',
    brideName: 'Aiza',
    groomName: 'Hamza',
    city: 'Lahore',
    startDate: '2026-12-12T00:00:00.000Z',
    status: 'BOOKING_VENDORS',
  },
  {
    id: 'demo-wedding-2',
    title: 'Noor & Saad Walima',
    brideName: 'Noor',
    groomName: 'Saad',
    city: 'Karachi',
    startDate: '2027-01-18T00:00:00.000Z',
    status: 'PLANNING',
  },
];

export function getDemoAdminData() {
  const vendor = {
    id: 'demo-vendor-1',
    businessName: 'Noor Wedding Halls Studio',
    ownerName: 'Demo Vendor',
    city: 'Lahore',
    verificationStatus: 'PENDING',
    verificationLevel: 'PLATFORM_TRUSTED',
    isActive: true,
  };
  const customer = {
    id: 'demo-customer-1',
    fullName: 'Demo Customer',
    email: 'customer@rasmbazaar.test',
    isActive: true,
    isSuspended: false,
    roles: [{ role: { name: 'CUSTOMER' } }],
  };

  return {
    dashboard: {
      metrics: {
        users: 18,
        vendors: 8,
        pendingVerifications: 3,
        completedBookings: 12,
        openDisputes: 1,
        overduePayments: 2,
        suspendedUsers: 0,
      },
    },
    users: [customer],
    vendors: [vendor],
    verifications: [
      {
        id: 'demo-verification-1',
        status: 'PENDING',
        vendor,
        documentType: 'Business Registration',
        documentUrl: 'https://example.test/demo-registration.pdf',
      },
    ],
    categories: [
      { id: 'cat-photo', name: 'Photography', slug: 'photography' },
      { id: 'cat-catering', name: 'Catering', slug: 'catering' },
    ],
    listings: [
      {
        id: 'listing-1',
        title: 'Signature Wedding Coverage',
        status: 'PUBLISHED',
        isActive: true,
        vendor,
      },
    ],
    bookings: [
      {
        id: 'booking-1',
        title: 'Baraat photography booking',
        status: 'CONFIRMED',
        totalAmount: 225000,
        vendor,
        customer,
      },
    ],
    payments: [
      {
        id: 'payment-1',
        title: 'Advance payment',
        status: 'OVERDUE',
        amount: 50000,
        dueDate: '2026-07-10T00:00:00.000Z',
        booking: { title: 'Baraat photography booking', vendor, customer },
      },
    ],
    reviews: [
      {
        id: 'review-1',
        status: 'FLAGGED',
        rating: 5,
        title: 'Great coordination',
        vendor,
        customer,
      },
    ],
    incidents: [
      {
        id: 'incident-1',
        status: 'OPEN',
        severity: 'Medium',
        title: 'Arrival timing clarification',
        vendor,
        booking: { title: 'Baraat photography booking' },
      },
    ],
    disputes: [
      {
        id: 'dispute-1',
        status: 'UNDER_REVIEW',
        reason: 'Timeline clarification',
        vendor,
        customer,
        booking: { title: 'Baraat photography booking' },
      },
    ],
    auditLogs: [
      {
        id: 'audit-1',
        action: 'DEMO_DATA_READY',
        entityType: 'Preview',
        actor: { fullName: 'Demo Admin', email: 'admin@rasmbazaar.test' },
        createdAt: '2026-07-17T00:00:00.000Z',
      },
    ],
    reports: {
      bookings: 12,
      vendors: 8,
      users: 18,
      grossBookingValue: 2250000,
    },
    savedViews: [
      { id: 'all-queues', label: 'All queues' },
      { id: 'high-risk', label: 'High risk' },
    ],
  };
}
