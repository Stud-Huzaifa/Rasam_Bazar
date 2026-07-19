import {
  demoCategories,
  demoVendors,
  filterDemoVendors,
  getDemoCategoryDetail,
  getDemoVendor,
} from './demo-data';
import {
  demoVendorDashboard,
  demoWeddings,
  getDemoAdminData,
} from './demo-session';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_ROOT = API_BASE_URL.endsWith('/api')
  ? API_BASE_URL
  : `${API_BASE_URL}/api`;

function getAuthToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem('accessToken');
}

function isDemoToken(token: string | null) {
  return Boolean(token?.startsWith('demo-access-token-'));
}

function parseBody(init: RequestInit) {
  if (typeof init.body !== 'string') {
    return {};
  }

  try {
    return JSON.parse(init.body);
  } catch {
    return {};
  }
}

function demoWeddingForPath(path: string) {
  const match = path.match(/^\/weddings\/([^/?]+)/);
  if (!match) {
    return null;
  }

  const weddingId = decodeURIComponent(match[1]);
  return (
    demoWeddings.find((wedding) => wedding.id === weddingId) ??
    (weddingId === 'demo123' ? demoWeddings[0] : null)
  );
}

function demoCollection(path: string) {
  if (path.includes('/guests')) {
    return [
      {
        id: 'demo-guest-1',
        name: 'Aisha Khan',
        side: 'BRIDE',
        groupName: 'Bride family',
        adults: 2,
        children: 1,
        status: 'CONFIRMED',
      },
      {
        id: 'demo-guest-2',
        name: 'Bilal Ahmed',
        side: 'GROOM',
        groupName: 'Groom friends',
        adults: 4,
        children: 0,
        status: 'PENDING',
      },
    ];
  }

  if (path.includes('/budget')) {
    return [
      {
        id: 'demo-budget-1',
        category: 'Photography',
        amount: 750000,
        isPaid: true,
      },
      {
        id: 'demo-budget-2',
        category: 'Catering',
        amount: 1250000,
        isPaid: false,
      },
    ];
  }

  if (path.includes('/tasks')) {
    return [
      {
        id: 'demo-task-1',
        title: 'Confirm Baraat venue timings',
        status: 'COMPLETED',
        isCompleted: true,
      },
      {
        id: 'demo-task-2',
        title: 'Finalize catering headcount',
        status: 'IN_PROGRESS',
        isCompleted: false,
      },
    ];
  }

  if (path.includes('/events')) {
    return [
      {
        id: 'demo-event-1',
        title: 'Mehndi',
        date: '2026-12-11T18:00:00.000Z',
        venue: 'Family Lawn',
        guestCount: 180,
      },
      {
        id: 'demo-event-2',
        title: 'Baraat',
        date: '2026-12-12T19:00:00.000Z',
        venue: 'Pearl Banquet',
        guestCount: 420,
      },
    ];
  }

  if (path.includes('/members')) {
    return [
      {
        id: 'demo-member-1',
        fullName: 'Sara Planner',
        role: 'Coordinator',
        email: 'sara@example.test',
      },
    ];
  }

  if (path.includes('/bookings')) {
    return demoBookings;
  }

  if (path.includes('/activity')) {
    return [
      {
        id: 'demo-activity-1',
        action: 'Proposal accepted',
        createdAt: '2026-07-17T10:00:00.000Z',
      },
      {
        id: 'demo-activity-2',
        action: 'Payment milestone created',
        createdAt: '2026-07-17T11:30:00.000Z',
      },
    ];
  }

  return [];
}

const demoBookings = [
  {
    id: 'demo-booking-1',
    title: 'Baraat photography booking',
    status: 'CONFIRMED',
    totalAmount: 225000,
    paidAmount: 50000,
    outstandingAmount: 175000,
    weddingId: 'demo-wedding-1',
    vendor: demoVendors[0],
    milestones: [
      {
        id: 'demo-milestone-1',
        title: 'Advance payment',
        amount: 50000,
        status: 'PAID',
        dueDate: '2026-07-20T00:00:00.000Z',
      },
      {
        id: 'demo-milestone-2',
        title: 'Final payment',
        amount: 175000,
        status: 'DUE',
        dueDate: '2026-12-10T00:00:00.000Z',
      },
    ],
  },
];

const demoProposals = [
  {
    id: 'demo-proposal-1',
    title: 'Signature wedding coverage',
    status: 'ACCEPTED',
    totalAmount: 225000,
    validUntil: '2026-12-01T00:00:00.000Z',
    vendor: demoVendors[0],
    versions: [
      {
        id: 'demo-proposal-version-1',
        versionNumber: 1,
        totalAmount: 250000,
        status: 'SUPERSEDED',
      },
      {
        id: 'demo-proposal-version-2',
        versionNumber: 2,
        totalAmount: 225000,
        status: 'ACCEPTED',
      },
    ],
  },
];

function getDemoResponse(path: string, init: RequestInit) {
  const method = String(init.method || 'GET').toUpperCase();
  const body = parseBody(init);

  if (method !== 'GET') {
    return {
      id: body.id || `demo-${Date.now()}`,
      status: body.status || 'SAVED',
      ...body,
    };
  }

  if (path === '/categories') {
    return demoCategories;
  }

  if (path.startsWith('/categories/')) {
    const [slug, query = ''] = path.replace('/categories/', '').split('?');
    const city = new URLSearchParams(query).get('city') || '';
    return getDemoCategoryDetail(slug, city);
  }

  if (path === '/vendors' || path.startsWith('/vendors?')) {
    const query = path.split('?')[1] || '';
    return filterDemoVendors(Object.fromEntries(new URLSearchParams(query)));
  }

  if (path.startsWith('/vendors/me/dashboard')) {
    return demoVendorDashboard;
  }

  if (path === '/vendors/me') {
    return demoVendors[0];
  }

  if (path.startsWith('/vendors/me/matching-requests')) {
    return [
      {
        id: 'demo-request-1',
        title: 'Baraat photography and video',
        category: { name: 'Photography' },
        city: 'Lahore',
        budgetMin: 180000,
        budgetMax: 260000,
        status: 'PUBLISHED',
        matchingScore: 94,
      },
    ];
  }

  if (path.startsWith('/vendors/me/proposals')) {
    return demoProposals;
  }

  if (path.startsWith('/vendors/me/inquiries')) {
    return [];
  }

  if (path.startsWith('/vendors/') && !path.includes('/inquiries')) {
    return getDemoVendor(path.split('/')[2]) || demoVendors[0];
  }

  if (path === '/vendor/bookings') {
    return demoBookings;
  }

  if (path === '/vendor/reviews') {
    return demoVendors[0].reviews;
  }

  if (path === '/vendor/trust') {
    return demoVendors[0].trustFactors;
  }

  if (path === '/weddings') {
    return demoWeddings;
  }

  if (path.startsWith('/weddings/')) {
    const wedding = demoWeddingForPath(path);
    if (path.includes('/dashboard')) {
      return { wedding };
    }
    if (path.includes('/plan')) {
      return { sections: [], tasks: demoCollection('/tasks') };
    }
    if (path.includes('/progress')) {
      return { completed: 1, total: 2, percent: 50 };
    }
    return wedding ?? demoCollection(path);
  }

  if (path === '/customer/bookings') {
    return demoBookings;
  }

  if (path === '/customer/proposals') {
    return demoProposals;
  }

  if (path === '/customer/reviews') {
    return [];
  }

  if (path === '/service-requests') {
    return [
      {
        id: 'demo-request-1',
        weddingId: 'demo-wedding-1',
        title: 'Baraat photography and video',
        status: 'PUBLISHED',
        category: { name: 'Photography' },
        proposals: demoProposals,
      },
    ];
  }

  if (path.includes('/matches')) {
    return demoVendors.map((vendor, index) => ({
      vendor,
      score: 95 - index * 5,
      reasons: ['Category match', 'City/service area match', 'Verified vendor'],
    }));
  }

  if (path === '/notifications' || path === '/message-threads') {
    return [];
  }

  if (path.includes('/messages')) {
    return [];
  }

  if (path.startsWith('/admin/')) {
    const admin = getDemoAdminData();
    const key = path.split('?')[0].replace('/admin/', '');
    const adminMap: Record<string, unknown> = {
      dashboard: admin.dashboard,
      users: admin.users,
      vendors: admin.vendors,
      'vendor-verifications': admin.verifications,
      'service-categories': admin.categories,
      listings: admin.listings,
      bookings: admin.bookings,
      payments: admin.payments,
      reviews: admin.reviews,
      incidents: admin.incidents,
      disputes: admin.disputes,
      'audit-logs': admin.auditLogs,
      reports: admin.reports,
      'saved-views': admin.savedViews,
    };
    return adminMap[key] ?? [];
  }

  return [];
}

export function saveToken(token: string) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('accessToken', token);
  }
}

export function saveAuthTokens(accessToken: string, refreshToken?: string) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      window.localStorage.setItem('refreshToken', refreshToken);
    }
  }
}

async function requestJson(path: string, init: RequestInit = {}) {
  const token = getAuthToken();
  if (isDemoToken(token)) {
    return getDemoResponse(path, init);
  }

  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export async function getJson(path: string) {
  return requestJson(path, { method: 'GET' });
}

export async function postJson(path: string, body: unknown) {
  return requestJson(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function patchJson(path: string, body: unknown) {
  return requestJson(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function deleteJson(path: string) {
  return requestJson(path, { method: 'DELETE' });
}
