const { expect, test } = require('@playwright/test');

const json = (data, status = 200) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(data),
});

const vendor = {
  id: 'vendor-1',
  businessName: 'Noor Events Studio',
  city: 'Lahore',
  serviceAreas: ['Lahore', 'Islamabad'],
  verificationLevel: 'BUSINESS_VERIFIED',
  trustFactors: {
    trustScore: 94,
    averageRating: 4.9,
    reviewCount: 42,
    trustSignals: [{ id: 'signal-1', label: 'Verified profile', score: 100 }],
  },
  metrics: {
    verificationLevel: 'BUSINESS_VERIFIED',
    activeServices: 3,
    activePackages: 2,
    teams: 2,
    trustScore: 94,
    averageRating: 4.9,
    reviewCount: 42,
    openDisputes: 0,
  },
};

const proposal = {
  id: 'proposal-1',
  status: 'SUBMITTED',
  serviceRequest: { id: 'request-1', title: 'Baraat photography' },
  versions: [{ id: 'version-1', versionNumber: 1, totalPrice: 225000 }],
};

async function mockApi(page) {
  await page.route('http://localhost:3001/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace('/api', '');
    const method = route.request().method();

    if (method !== 'GET') {
      await route.fulfill(json({ ok: true, id: 'created-1' }));
      return;
    }

    if (path === '/categories') {
      await route.fulfill(
        json([
          { id: 'cat-photo', name: 'Photography', slug: 'photography' },
          { id: 'cat-catering', name: 'Catering', slug: 'catering' },
        ]),
      );
      return;
    }

    if (path === '/vendors') {
      await route.fulfill(json([vendor]));
      return;
    }

    if (path === '/vendors/vendor-1') {
      await route.fulfill(
        json({
          ...vendor,
          description: 'Wedding photography and event coverage.',
          startingPrice: 150000,
          services: [
            {
              id: 'service-1',
              title: 'Wedding Photography',
              description: 'Full-day coverage.',
              category: { name: 'Photography' },
            },
          ],
          packages: [
            {
              id: 'package-1',
              name: 'Signature',
              price: 225000,
              description: 'Photo and video package.',
            },
          ],
          availability: [{ id: 'slot-1', status: 'AVAILABLE' }],
          reviews: [],
          portfolio: [],
        }),
      );
      return;
    }

    if (path === '/vendors/me/dashboard') {
      await route.fulfill(json({ vendor, metrics: vendor.metrics }));
      return;
    }

    if (path === '/vendors/me/matching-requests') {
      await route.fulfill(
        json([
          {
            match: { score: 91 },
            request: {
              id: 'request-1',
              title: 'Baraat photography',
              eventDate: '2026-12-12',
              city: 'Lahore',
            },
          },
        ]),
      );
      return;
    }

    if (path === '/vendors/me/proposals') {
      await route.fulfill(json([proposal]));
      return;
    }

    if (path === '/admin/dashboard') {
      await route.fulfill(
        json({
          users: 16,
          vendors: 7,
          completedBookings: 5,
          openDisputes: 1,
          overduePayments: 2,
          pendingVerifications: 3,
          grossBookingValue: 650000,
        }),
      );
      return;
    }

    if (path === '/admin/users') {
      await route.fulfill(
        json([
          {
            id: 'user-1',
            fullName: 'Aisha Customer',
            email: 'aisha@example.test',
            role: 'CUSTOMER',
            isActive: true,
          },
        ]),
      );
      return;
    }

    if (path === '/admin/vendors') {
      await route.fulfill(json([vendor]));
      return;
    }

    if (path === '/admin/vendor-verifications') {
      await route.fulfill(
        json([{ id: 'verification-1', status: 'PENDING', vendor }]),
      );
      return;
    }

    if (path === '/admin/bookings') {
      await route.fulfill(
        json([
          {
            id: 'booking-1',
            title: 'Baraat photography',
            status: 'CONFIRMED',
            totalAmount: 225000,
            vendor,
            customer: { fullName: 'Aisha Customer' },
          },
        ]),
      );
      return;
    }

    if (path === '/admin/payments') {
      await route.fulfill(
        json([
          {
            id: 'payment-1',
            status: 'DUE',
            amount: 50000,
            booking: { id: 'booking-1', title: 'Baraat photography', vendor },
          },
        ]),
      );
      return;
    }

    if (path === '/admin/reviews') {
      await route.fulfill(
        json([{ id: 'review-1', status: 'PUBLISHED', rating: 5, vendor }]),
      );
      return;
    }

    if (path === '/admin/disputes') {
      await route.fulfill(
        json([{ id: 'dispute-1', status: 'OPEN', vendor, booking: {} }]),
      );
      return;
    }

    if (path === '/admin/incidents') {
      await route.fulfill(json([{ id: 'incident-1', status: 'OPEN', vendor }]));
      return;
    }

    if (path === '/admin/audit-logs') {
      await route.fulfill(
        json([{ id: 'audit-1', action: 'REVIEW_UPDATED', actorId: 'admin-1' }]),
      );
      return;
    }

    if (path === '/admin/reports') {
      await route.fulfill(json({ generatedAt: '2026-07-16T00:00:00.000Z' }));
      return;
    }

    if (path === '/admin/saved-views') {
      await route.fulfill(json([{ id: 'view-1', name: 'High risk' }]));
      return;
    }

    await route.fulfill(json([]));
  });
}

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test('customer journey finds a vendor and sends an inquiry', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /RasmBazaar/i }),
  ).toBeVisible();

  await page
    .getByRole('link', { name: /Vendor Talash Karein/i })
    .first()
    .click();
  await expect(
    page.getByRole('heading', { name: /Vendor talash/i }),
  ).toBeVisible();
  await expect(page.getByText('Noor Events Studio')).toBeVisible();

  await page.getByRole('link', { name: /Noor Events Studio/i }).click();
  await expect(
    page.getByRole('heading', { name: 'Noor Events Studio' }),
  ).toBeVisible();

  await page.getByLabel('Your name').fill('Aisha Khan');
  await page.getByLabel('Email').fill('aisha@example.test');
  await page.getByLabel('City').fill('Lahore');
  await page.getByLabel('What do you need?').fill('Need Baraat photography.');
  await page.getByRole('button', { name: /Quote Mangwayein/i }).click();
  await expect(page.getByRole('status')).toContainText(
    'Request bhej di gayi hai',
  );
});

test('vendor journey reviews matches and submits a proposal', async ({
  page,
}) => {
  await page.goto('/vendor/dashboard');
  await expect(
    page.getByRole('heading', { name: /Noor Events Studio/i }),
  ).toBeVisible();
  await expect(page.getByText('94').first()).toBeVisible();

  await page.goto('/vendor/proposals');
  await expect(
    page.getByRole('heading', { name: /Submit quotations and revisions/i }),
  ).toBeVisible();
  await expect(page.getByText(/Baraat photography - 91% match/i)).toBeVisible();

  await page.getByPlaceholder('Total price').fill('250000');
  await page
    .getByPlaceholder('Package description')
    .fill('Photo and video team');
  await page.getByPlaceholder('Inclusions').fill('Lead photographer, album');
  await page.getByPlaceholder('Payment schedule').fill('50% advance');
  await page.getByRole('button', { name: 'Submit proposal' }).click();
  await expect(page.getByText(/Version 1 - SUBMITTED/i)).toBeVisible();
});

test('admin journey loads operational queues and saved views', async ({
  page,
}) => {
  await page.goto('/admin');
  await expect(
    page.getByRole('heading', { name: /Marketplace Operations Center/i }),
  ).toBeVisible();
  await expect(page.getByText('Active Vendors')).toBeVisible();
  await expect(page.getByText('Noor Events Studio')).toBeVisible();

  await page.getByLabel('Search admin data').fill('Noor');
  await expect(page.getByText('Vendor verification workflow')).toBeVisible();
  await page.locator('select').first().selectOption('High risk');
  await expect(page.getByText('Payments')).toBeVisible();
});
