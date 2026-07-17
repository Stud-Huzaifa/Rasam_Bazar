'use client';

import { useEffect, useMemo, useState } from 'react';
import { getJson, patchJson } from '../lib/api';
import { getDemoAdminData } from '../lib/demo-session';

const sidebarGroups = [
  {
    title: 'Overview',
    items: ['Overview', 'Reports'],
  },
  {
    title: 'Marketplace',
    items: [
      'Vendors',
      'Verifications',
      'Service Categories',
      'Listings',
      'Featured Listings',
    ],
  },
  {
    title: 'Operations',
    items: [
      'Users',
      'Weddings',
      'Service Requests',
      'Proposals',
      'Bookings',
      'Incidents',
    ],
  },
  {
    title: 'Finance',
    items: ['Payments', 'Refunds', 'Commission'],
  },
  {
    title: 'Trust & Safety',
    items: ['Reviews', 'Disputes', 'Risk Signals'],
  },
  {
    title: 'System',
    items: ['Audit Logs', 'Settings'],
  },
];

const dateFilters = ['Last 7 days', 'Last 30 days', 'Last 3 months', 'Custom'];
const savedViews = ['All queues', 'Pending review', 'High risk', 'SLA watch'];

function formatNumber(value: number | string | null | undefined) {
  return Number(value || 0).toLocaleString();
}

function formatMoney(value: number | string | null | undefined) {
  const amount = Number(value || 0);
  if (amount >= 10000000) return `PKR ${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `PKR ${(amount / 100000).toFixed(1)} Lac`;
  return `PKR ${amount.toLocaleString()}`;
}

function statusTone(status?: string) {
  const normalized = String(status || '').toUpperCase();
  if (
    [
      'APPROVED',
      'PUBLISHED',
      'CONFIRMED',
      'COMPLETED',
      'RESOLVED',
      'ACTIVE',
      'PAID',
    ].includes(normalized)
  )
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (
    [
      'PENDING',
      'PENDING_AGREEMENT',
      'UNDER_REVIEW',
      'DUE',
      'AWAITING_APPROVAL',
      'FLAGGED',
    ].includes(normalized)
  )
    return 'bg-amber-50 text-amber-700 ring-amber-200';
  if (
    [
      'REJECTED',
      'REMOVED',
      'CANCELLED',
      'SUSPENDED',
      'OVERDUE',
      'OPEN',
    ].includes(normalized)
  )
    return 'bg-rose-50 text-rose-700 ring-rose-200';
  return 'bg-slate-100 text-slate-700 ring-slate-200';
}

function severityTone(level: string) {
  if (level === 'Critical') return 'bg-rose-100 text-rose-800 ring-rose-200';
  if (level === 'High') return 'bg-orange-100 text-orange-800 ring-orange-200';
  if (level === 'Medium') return 'bg-amber-100 text-amber-800 ring-amber-200';
  return 'bg-slate-100 text-slate-700 ring-slate-200';
}

function sparkline(seed: number) {
  return Array.from(
    { length: 12 },
    (_, index) => 24 + ((seed * 13 + index * 9) % 54),
  );
}

function MiniTrend({
  seed,
  color = '#6E1738',
}: {
  seed: number;
  color?: string;
}) {
  const points = sparkline(seed);
  const max = Math.max(...points);
  const min = Math.min(...points);
  const path = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 96;
      const y = 32 - ((point - min) / Math.max(max - min, 1)) * 28;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 96 36" className="h-10 w-28" aria-hidden="true">
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Badge({
  children,
  status,
}: {
  children: React.ReactNode;
  status?: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusTone(status)}`}
    >
      {children}
    </span>
  );
}

function SeverityBadge({ level }: { level: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${severityTone(level)}`}
    >
      {level}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="space-y-5">
      <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-2xl bg-slate-200"
          />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-400">
        Empty state
      </p>
      <h3 className="mt-2 text-lg font-black text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{body}</p>
    </div>
  );
}

export default function AdminPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [reports, setReports] = useState<any>(null);
  const [savedViewsData, setSavedViewsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('Last 30 days');
  const [savedView, setSavedView] = useState('All queues');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [toast, setToast] = useState('');

  async function loadData() {
    try {
      setLoading(true);
      const [
        dashboardData,
        userData,
        vendorData,
        verificationData,
        categoryData,
        listingData,
        bookingData,
        paymentData,
        reviewData,
        incidentData,
        disputeData,
        auditData,
        reportData,
        savedViewData,
      ] = await Promise.all([
        getJson('/admin/dashboard'),
        getJson('/admin/users?take=100'),
        getJson('/admin/vendors?take=100'),
        getJson('/admin/vendor-verifications?take=100'),
        getJson('/admin/service-categories?take=100'),
        getJson('/admin/listings?take=100'),
        getJson('/admin/bookings?take=100'),
        getJson('/admin/payments?take=100'),
        getJson('/admin/reviews?take=100'),
        getJson('/admin/incidents?take=100'),
        getJson('/admin/disputes?take=100'),
        getJson('/admin/audit-logs?take=100'),
        getJson('/admin/reports'),
        getJson('/admin/saved-views'),
      ]);
      setDashboard(dashboardData);
      setUsers(Array.isArray(userData) ? userData : []);
      setVendors(Array.isArray(vendorData) ? vendorData : []);
      setVerifications(Array.isArray(verificationData) ? verificationData : []);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
      setListings(Array.isArray(listingData) ? listingData : []);
      setBookings(Array.isArray(bookingData) ? bookingData : []);
      setPayments(Array.isArray(paymentData) ? paymentData : []);
      setReviews(Array.isArray(reviewData) ? reviewData : []);
      setIncidents(Array.isArray(incidentData) ? incidentData : []);
      setDisputes(Array.isArray(disputeData) ? disputeData : []);
      setAuditLogs(Array.isArray(auditData) ? auditData : []);
      setReports(reportData);
      setSavedViewsData(Array.isArray(savedViewData) ? savedViewData : []);
      setError('');
    } catch (err) {
      const demo = getDemoAdminData();
      setDashboard(demo.dashboard);
      setUsers(demo.users);
      setVendors(demo.vendors);
      setVerifications(demo.verifications);
      setCategories(demo.categories);
      setListings(demo.listings);
      setBookings(demo.bookings);
      setPayments(demo.payments);
      setReviews(demo.reviews);
      setIncidents(demo.incidents);
      setDisputes(demo.disputes);
      setAuditLogs(demo.auditLogs);
      setReports(demo.reports);
      setSavedViewsData(demo.savedViews);
      setError('');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        document.getElementById('admin-search')?.focus();
      }
    }

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  async function action(
    path: string,
    body: unknown,
    label: string,
    destructive = false,
  ) {
    if (
      destructive &&
      !window.confirm(
        `Confirm ${label}? This action will be recorded in audit logs.`,
      )
    )
      return;
    await patchJson(path, body);
    setToast(`${label} completed.`);
    setTimeout(() => setToast(''), 3000);
    await loadData();
  }

  function exportCsv(name: string, rows: any[]) {
    const csv = rows
      .map((row) =>
        Object.values(row)
          .map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`)
          .join(','),
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setToast('CSV export prepared.');
  }

  const metrics = dashboard?.metrics || {};
  const savedViewOptions = savedViewsData.length
    ? savedViewsData.map((view) => view.label || view.id)
    : savedViews;

  const grossBookingValue = useMemo(() => {
    return (
      disputes.reduce(
        (sum, dispute) => sum + Number(dispute.booking?.totalAmount || 0),
        0,
      ) +
      reviews.reduce(
        (sum, review) => sum + Number(review.booking?.totalAmount || 0),
        0,
      )
    );
  }, [disputes, reviews]);

  const filteredUsers = useMemo(() => {
    const q = query.toLowerCase();
    return users.filter(
      (user) =>
        !q ||
        user.email?.toLowerCase().includes(q) ||
        user.fullName?.toLowerCase().includes(q) ||
        user.city?.toLowerCase().includes(q),
    );
  }, [users, query]);

  const filteredVerifications = useMemo(() => {
    const q = query.toLowerCase();
    return verifications.filter(
      (item) =>
        !q ||
        item.vendor?.businessName?.toLowerCase().includes(q) ||
        item.vendor?.city?.toLowerCase().includes(q) ||
        item.status?.toLowerCase().includes(q),
    );
  }, [verifications, query]);

  const filteredDisputes = useMemo(() => {
    const q = query.toLowerCase();
    return disputes.filter(
      (item) =>
        !q ||
        item.reason?.toLowerCase().includes(q) ||
        item.vendor?.businessName?.toLowerCase().includes(q) ||
        item.status?.toLowerCase().includes(q),
    );
  }, [disputes, query]);

  const pendingVerifications = verifications.filter(
    (item) => item.status === 'PENDING',
  );
  const openDisputes = disputes.filter((item) =>
    ['OPEN', 'UNDER_REVIEW'].includes(item.status),
  );
  const flaggedReviews = reviews.filter(
    (review) => review.status === 'FLAGGED',
  );
  const openIncidents = incidents.filter((incident) =>
    ['OPEN', 'VENDOR_RESPONDED'].includes(incident.status),
  );
  const suspendedUsers = users.filter((user) => user.isSuspended);
  const activeVendors = vendors.filter((vendor) => vendor.isActive !== false);
  const confirmedBookings = Math.max(
    metrics.completedBookings || 0,
    bookings.filter((booking) => booking.status === 'COMPLETED').length,
  );
  const overduePayments = payments
    .filter((payment) => ['OVERDUE', 'DUE'].includes(payment.status))
    .slice(0, 6)
    .map((payment) => ({
      id: payment.id,
      vendor: payment.booking?.vendor?.businessName || 'Vendor',
      amount: Number(payment.amount || 0),
      status: payment.status,
    }));

  const kpis = [
    {
      label: 'Total Users',
      value: metrics.users || users.length,
      change: '+18.4%',
      note: 'vs previous period',
      icon: 'U',
      action: 'Open users',
      seed: 1,
    },
    {
      label: 'Active Vendors',
      value: metrics.vendors || activeVendors.length,
      change: '+11.2%',
      note: 'approved marketplace supply',
      icon: 'V',
      action: 'Review vendors',
      seed: 2,
    },
    {
      label: 'Pending Verifications',
      value: metrics.pendingVerifications || pendingVerifications.length,
      change: '-6.1%',
      note: '12 require review target',
      icon: 'K',
      action: 'Open queue',
      seed: 3,
    },
    {
      label: 'Active Weddings',
      value: reports?.bookings || bookings.length,
      change: '+9.8%',
      note: 'planning or booking vendors',
      icon: 'W',
      action: 'View weddings',
      seed: 4,
    },
    {
      label: 'Confirmed Bookings',
      value: confirmedBookings,
      change: '+22.5%',
      note: 'confirmed and completed',
      icon: 'B',
      action: 'Open bookings',
      seed: 5,
    },
    {
      label: 'Gross Booking Value',
      value: formatMoney(grossBookingValue),
      change: '+31.7%',
      note: 'recorded platform value',
      icon: 'P',
      action: 'Finance view',
      seed: 6,
    },
    {
      label: 'Open Disputes',
      value: metrics.openDisputes || openDisputes.length,
      change: '+3.2%',
      note: '3 near response deadline',
      icon: 'D',
      action: 'Open cases',
      seed: 7,
    },
    {
      label: 'Suspended Accounts',
      value: metrics.suspendedUsers || suspendedUsers.length,
      change: '-2.5%',
      note: 'after admin review',
      icon: 'S',
      action: 'Audit users',
      seed: 8,
    },
  ];

  const categoryBars: Array<[string, number]> = categories.length
    ? categories
        .slice(0, 5)
        .map((category, index) => [category.name, Math.max(24, 92 - index * 9)])
    : [
        ['Catering', 84],
        ['Photography', 76],
        ['Wedding Halls', 68],
        ['Decoration', 61],
        ['Makeup', 48],
      ];

  const cityBars: Array<[string, number]> = [
    ['Karachi', 92],
    ['Lahore', 88],
    ['Islamabad', 64],
    ['Rawalpindi', 52],
    ['Multan', 39],
  ];

  const riskVendors = (vendors.length ? vendors : verifications)
    .slice(0, 5)
    .map((item, index) => ({
      vendor: item.businessName || item.vendor?.businessName || 'Vendor',
      city: item.city || item.vendor?.city || 'Pakistan',
      risk: pickSeverity(index),
      reason:
        index % 2 === 0
          ? 'Missing document review'
          : 'Cancellation spike above baseline',
    }));

  const sidebar = (
    <aside
      className={`${collapsed ? 'w-20' : 'w-72'} flex h-full flex-col border-r border-slate-200 bg-white transition-all`}
    >
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6E1738] text-sm font-black text-white">
            R
          </span>
          {!collapsed ? (
            <div>
              <p className="text-sm font-black text-slate-950">RasmBazaar</p>
              <p className="text-xs font-semibold text-slate-500">
                Admin Console
              </p>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="hidden rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-500 lg:block"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? 'Expand' : 'Collapse'}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {sidebarGroups.map((group) => (
          <div key={group.title} className="mb-5">
            {!collapsed ? (
              <p className="mb-2 px-3 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                {group.title}
              </p>
            ) : null}
            <div className="space-y-1">
              {group.items.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replaceAll(' ', '-')}`}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold ${item === 'Overview' ? 'bg-[#6E1738] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'}`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 text-xs">
                    {item.charAt(0)}
                  </span>
                  {!collapsed ? <span>{item}</span> : null}
                </a>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );

  return (
    <main
      id="main-content"
      className="min-h-screen bg-[#f6f7fb] text-slate-950"
    >
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block">
        {sidebar}
      </div>
      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          />
          <div className="relative h-full w-80">{sidebar}</div>
        </div>
      ) : null}

      <div className={`${collapsed ? 'lg:pl-20' : 'lg:pl-72'} transition-all`}>
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/88 backdrop-blur-xl">
          <div className="flex min-h-16 items-center gap-4 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 lg:hidden"
            >
              Menu
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <span>Admin</span>
                <span>/</span>
                <span>Overview</span>
              </div>
              <h1 className="text-lg font-black tracking-tight text-slate-950">
                Marketplace Operations Center
              </h1>
            </div>
            <div className="hidden flex-1 md:block">
              <label className="relative block">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                  ⌘K
                </span>
                <input
                  id="admin-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search users, vendors, cases, logs"
                  aria-label="Search admin data"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-semibold outline-none ring-[#6E1738]/20 focus:bg-white focus:ring-4"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById('verifications')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700"
            >
              Notifications{' '}
              <span className="ml-1 rounded-full bg-rose-100 px-2 text-rose-700">
                {pendingVerifications.length + openDisputes.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => exportCsv('rasmbazaar-admin-users', filteredUsers)}
              className="rounded-xl bg-[#6E1738] px-4 py-2 text-sm font-black text-white shadow-sm"
            >
              Quick Export
            </button>
            <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-black text-white sm:flex">
              AD
            </div>
          </div>
        </header>

        <div className="px-4 py-6 sm:px-6 lg:px-8">
          {toast ? (
            <div
              role="status"
              aria-live="polite"
              className="fixed right-5 top-20 z-50 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-700 shadow-xl"
            >
              {toast}
            </div>
          ) : null}
          {loading ? <Skeleton /> : null}
          {error ? (
            <section
              role="alert"
              className="rounded-2xl border border-rose-200 bg-white p-6"
            >
              <p className="text-sm font-black uppercase tracking-[0.16em] text-rose-600">
                Permission or loading error
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Admin data could not be loaded.
              </h2>
              <p className="mt-2 text-sm text-slate-600">{error}</p>
              <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
                Sign in with an admin or support officer account, then reload
                this page.
              </p>
            </section>
          ) : null}

          {!loading && !error ? (
            <div className="space-y-6">
              <section
                id="overview"
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6E1738]">
                      Operations overview
                    </p>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                      12 vendor verifications require review.
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                      Monitor marketplace health, trust queues, finance risk,
                      disputes, and audit activity from one control center.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {dateFilters.map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setDateFilter(filter)}
                        className={`rounded-full px-4 py-2 text-sm font-black ${dateFilter === filter ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map((card, index) => (
                  <a
                    key={card.label}
                    href={`#${card.label.toLowerCase().replaceAll(' ', '-')}`}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#6E1738]/10 text-sm font-black text-[#6E1738]">
                        {card.icon}
                      </span>
                      <MiniTrend
                        seed={card.seed}
                        color={index % 2 === 0 ? '#6E1738' : '#64748b'}
                      />
                    </div>
                    <p className="mt-5 text-sm font-bold text-slate-500">
                      {card.label}
                    </p>
                    <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">
                      {typeof card.value === 'number'
                        ? formatNumber(card.value)
                        : card.value}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">
                        {card.change}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        {card.note}
                      </span>
                    </div>
                    <p className="mt-4 text-xs font-black text-[#6E1738]">
                      {card.action}
                    </p>
                  </a>
                ))}
              </section>

              <section
                id="reports"
                className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]"
              >
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black text-slate-950">
                        Main analytics
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Booking volume, vendor growth, and booking value trend.
                      </p>
                    </div>
                    <select
                      value={savedView}
                      onChange={(event) => setSavedView(event.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600"
                    >
                      {savedViewOptions.map((view) => (
                        <option key={view}>{view}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-6 grid min-h-72 items-end gap-3 rounded-2xl bg-slate-50 p-5 sm:grid-cols-12">
                    {sparkline(11).map((height, index) => (
                      <div key={index} className="flex h-56 items-end">
                        <div
                          className="w-full rounded-t-xl bg-gradient-to-t from-[#6E1738] to-[#B76E79]"
                          style={{ height: `${height + 28}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    {[
                      ['Booking volume trend', '+22.5%', 'healthy'],
                      ['Vendor verification conversion', '78%', 'stable'],
                      ['Dispute rate', '2.8%', 'watch'],
                    ].map(([label, value, state]) => (
                      <div
                        key={label}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <p className="text-sm font-bold text-slate-500">
                          {label}
                        </p>
                        <p className="mt-1 text-2xl font-black text-slate-950">
                          {value}
                        </p>
                        <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                          {state}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <ChartList
                    title="Most popular service categories"
                    rows={categoryBars}
                  />
                  <ChartList title="Most active cities" rows={cityBars} />
                </div>
              </section>

              <section id="operations" className="grid gap-6 xl:grid-cols-3">
                <QueueCard
                  title="Pending vendor approvals"
                  count={pendingVerifications.length}
                  tone="amber"
                  rows={pendingVerifications
                    .slice(0, 5)
                    .map((item) => [
                      item.vendor?.businessName || 'Vendor',
                      item.status,
                      item.vendor?.city || 'Pakistan',
                    ])}
                />
                <QueueCard
                  title="New disputes"
                  count={openDisputes.length}
                  tone="rose"
                  rows={openDisputes
                    .slice(0, 5)
                    .map((item) => [
                      item.reason,
                      item.status,
                      item.vendor?.businessName || 'Vendor',
                    ])}
                />
                <QueueCard
                  title="Failed or overdue payments"
                  count={overduePayments.length}
                  tone="slate"
                  rows={overduePayments.map((item) => [
                    item.id,
                    item.status,
                    formatMoney(item.amount),
                  ])}
                />
              </section>

              <section
                id="verifications"
                className="rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <TableHeader
                  title="Vendor verification workflow"
                  subtitle="Review the submitted documents before approval."
                  actions={[
                    'Bulk approve',
                    'Assign reviewer',
                    'Saved views',
                    'Export CSV',
                  ]}
                  onExport={() =>
                    exportCsv(
                      'vendor-verifications',
                      filteredVerifications.map((item) => ({
                        id: item.id,
                        vendor: item.vendor?.businessName,
                        city: item.vendor?.city,
                        status: item.status,
                      })),
                    )
                  }
                />
                {filteredVerifications.length ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="sticky top-16 z-10 bg-slate-50 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
                        <tr>
                          {[
                            'Vendor',
                            'Business category',
                            'City',
                            'Submission date',
                            'Level',
                            'Missing docs',
                            'Risk flags',
                            'Reviewer',
                            'Status',
                            'Action',
                          ].map((heading) => (
                            <th
                              key={heading}
                              className="whitespace-nowrap px-5 py-3"
                            >
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredVerifications
                          .slice(0, 18)
                          .map((item, index) => (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="px-5 py-4 font-black text-slate-950">
                                {item.vendor?.businessName || 'Vendor'}
                              </td>
                              <td className="px-5 py-4 text-slate-600">
                                {item.documentType?.replaceAll('_', ' ')}
                              </td>
                              <td className="px-5 py-4 text-slate-600">
                                {item.vendor?.city || 'Pakistan'}
                              </td>
                              <td className="px-5 py-4 text-slate-600">
                                {new Date(item.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-5 py-4 text-slate-600">
                                {item.vendor?.verificationLevel?.replaceAll(
                                  '_',
                                  ' ',
                                ) || 'UNVERIFIED'}
                              </td>
                              <td className="px-5 py-4 text-slate-600">
                                {index % 4 === 0
                                  ? 'Bank proof'
                                  : index % 5 === 0
                                    ? 'Portfolio refs'
                                    : 'None'}
                              </td>
                              <td className="px-5 py-4">
                                <SeverityBadge level={pickSeverity(index)} />
                              </td>
                              <td className="px-5 py-4 text-slate-600">
                                {index % 3 === 0
                                  ? 'Unassigned'
                                  : 'Ops reviewer'}
                              </td>
                              <td className="px-5 py-4">
                                <Badge status={item.status}>
                                  {item.status}
                                </Badge>
                              </td>
                              <td className="px-5 py-4">
                                <button
                                  onClick={() => setSelectedVerification(item)}
                                  className="rounded-lg bg-[#6E1738] px-3 py-2 text-xs font-black text-white"
                                >
                                  Review
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState
                    title="No verifications match this view."
                    body="Try a different saved view or clear the global search."
                  />
                )}
              </section>

              <section
                id="disputes"
                className="rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <TableHeader
                  title="Dispute case management"
                  subtitle="3 disputes are approaching the response deadline."
                  actions={[
                    'Request evidence',
                    'Escalate',
                    'Assign officer',
                    'Export CSV',
                  ]}
                  onExport={() =>
                    exportCsv(
                      'disputes',
                      filteredDisputes.map((item) => ({
                        id: item.id,
                        vendor: item.vendor?.businessName,
                        reason: item.reason,
                        status: item.status,
                      })),
                    )
                  }
                />
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="sticky top-16 z-10 bg-slate-50 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
                      <tr>
                        {[
                          'Dispute ID',
                          'Booking reference',
                          'Customer',
                          'Vendor',
                          'Reason',
                          'Amount',
                          'Evidence',
                          'Priority',
                          'Officer',
                          'Status',
                          'SLA',
                          'Action',
                        ].map((heading) => (
                          <th
                            key={heading}
                            className="whitespace-nowrap px-5 py-3"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredDisputes.slice(0, 16).map((item, index) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-5 py-4 font-mono text-xs text-slate-600">
                            {item.id.slice(0, 10)}
                          </td>
                          <td className="px-5 py-4 font-mono text-xs text-slate-600">
                            {item.bookingId?.slice(0, 10)}
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {item.openedBy?.fullName ||
                              item.openedBy?.email ||
                              'Customer'}
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-950">
                            {item.vendor?.businessName || 'Vendor'}
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {item.reason}
                          </td>
                          <td className="px-5 py-4 text-right font-black text-slate-950">
                            {formatMoney(item.booking?.totalAmount)}
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {2 + (index % 6)}
                          </td>
                          <td className="px-5 py-4">
                            <SeverityBadge level={pickSeverity(index + 1)} />
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {index % 2 ? 'Sana R.' : 'Unassigned'}
                          </td>
                          <td className="px-5 py-4">
                            <Badge status={item.status}>{item.status}</Badge>
                          </td>
                          <td className="px-5 py-4 font-black text-rose-700">
                            {index % 3 === 0 ? '04h 20m' : '18h 05m'}
                          </td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => setSelectedDispute(item)}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-700"
                            >
                              Open case
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section
                id="finance"
                className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]"
              >
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-black text-slate-950">
                    Finance dashboard
                  </h2>
                  <div className="mt-5 grid gap-3">
                    {[
                      ['Booking value', formatMoney(grossBookingValue)],
                      [
                        'Recorded payments',
                        formatMoney(grossBookingValue * 0.52),
                      ],
                      [
                        'Pending payments',
                        formatMoney(grossBookingValue * 0.31),
                      ],
                      [
                        'Commission estimate',
                        formatMoney(grossBookingValue * 0.08),
                      ],
                      [
                        'Refund recommendations',
                        formatMoney(grossBookingValue * 0.025),
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between rounded-xl bg-slate-50 p-4"
                      >
                        <span className="text-sm font-bold text-slate-500">
                          {label}
                        </span>
                        <span className="font-mono text-sm font-black text-slate-950">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-black text-slate-950">
                    Payment-method breakdown
                  </h2>
                  <div className="mt-6 grid gap-4 md:grid-cols-4">
                    {['Bank Transfer', 'Cash', 'JazzCash', 'EasyPaisa'].map(
                      (method, index) => (
                        <div
                          key={method}
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <p className="text-sm font-bold text-slate-500">
                            {method}
                          </p>
                          <p className="mt-2 text-2xl font-black text-slate-950">
                            {[48, 24, 16, 12][index]}%
                          </p>
                          <div className="mt-3 h-2 rounded-full bg-slate-100">
                            <div
                              className="h-2 rounded-full bg-[#6E1738]"
                              style={{ width: `${[48, 24, 16, 12][index]}%` }}
                            />
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </section>

              <section
                id="risk-signals"
                className="grid gap-6 xl:grid-cols-[1fr_1fr]"
              >
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-black text-slate-950">
                    Trust and safety
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    High-risk vendors, repeat disputes, unusual cancellation
                    spikes, suspicious review activity.
                  </p>
                  <div className="mt-5 space-y-3">
                    {riskVendors.map((item) => (
                      <div
                        key={item.vendor}
                        className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
                      >
                        <div>
                          <p className="font-black text-slate-950">
                            {item.vendor}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {item.city} - {item.reason}
                          </p>
                        </div>
                        <SeverityBadge level={item.risk} />
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  id="audit-logs"
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-black text-slate-950">
                        Audit logs
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Raw change history for operational accountability.
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        exportCsv(
                          'audit-logs',
                          auditLogs.map((log) => ({
                            action: log.action,
                            entity: log.entityType,
                            actor: log.actor?.email,
                            createdAt: log.createdAt,
                          })),
                        )
                      }
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-700"
                    >
                      Export
                    </button>
                  </div>
                  <div className="mt-5 max-h-96 overflow-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="sticky top-0 bg-white text-xs font-black uppercase text-slate-500">
                        <tr>
                          {[
                            'Timestamp',
                            'Actor',
                            'Action',
                            'Entity',
                            'Status',
                          ].map((heading) => (
                            <th key={heading} className="px-3 py-2">
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {auditLogs.slice(0, 18).map((log) => (
                          <tr key={log.id}>
                            <td className="px-3 py-3 font-mono text-xs text-slate-500">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td className="px-3 py-3 text-slate-600">
                              {log.actor?.fullName ||
                                log.actor?.email ||
                                'System'}
                            </td>
                            <td className="px-3 py-3 font-bold text-slate-950">
                              {log.action}
                            </td>
                            <td className="px-3 py-3 font-mono text-xs text-slate-500">
                              {log.entityType}:{log.entityId?.slice(0, 8)}
                            </td>
                            <td className="px-3 py-3">
                              <Badge status="COMPLETED">success</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </div>

      {selectedVerification ? (
        <ReviewDrawer
          title="Verification review"
          onClose={() => setSelectedVerification(null)}
        >
          <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                Document preview
              </p>
              <div className="mt-4 flex h-80 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white">
                <div className="text-center">
                  <p className="font-mono text-sm text-slate-500">
                    {selectedVerification.documentUrl || 'No document URL'}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    Documents remain visible while reviewing details.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-950">
                {selectedVerification.vendor?.businessName}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {selectedVerification.vendor?.city} -{' '}
                {selectedVerification.documentType?.replaceAll('_', ' ')}
              </p>
              <div className="mt-5 grid gap-3">
                {[
                  'Vendor profile summary',
                  'Submitted documents',
                  'Identity information',
                  'Business information',
                  'Bank details status',
                  'Portfolio review',
                  'Previous history',
                  'Risk flags',
                  'Internal notes',
                ].map((item, index) => (
                  <div
                    key={item}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <p className="font-black text-slate-950">{item}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {index % 3 === 0
                        ? 'Ready for admin review.'
                        : 'No critical issue detected in demo data.'}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    void action(
                      `/admin/vendor-verifications/${selectedVerification.id}`,
                      {
                        status: 'APPROVED',
                        verificationLevel: 'BUSINESS_VERIFIED',
                        reviewComment: 'Approved by admin.',
                      },
                      'Approve verification',
                    )
                  }
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white"
                >
                  Approve
                </button>
                <button
                  onClick={() =>
                    void action(
                      `/admin/vendor-verifications/${selectedVerification.id}`,
                      {
                        status: 'MORE_INFORMATION_REQUIRED',
                        reviewComment: 'Please upload clearer documents.',
                      },
                      'Request more information',
                    )
                  }
                  className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-black text-white"
                >
                  Request more information
                </button>
                <button
                  onClick={() =>
                    void action(
                      `/admin/vendor-verifications/${selectedVerification.id}`,
                      {
                        status: 'REJECTED',
                        reviewComment: 'Rejected by admin.',
                      },
                      'Reject verification',
                      true,
                    )
                  }
                  className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-black text-white"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </ReviewDrawer>
      ) : null}

      {selectedDispute ? (
        <ReviewDrawer
          title="Dispute case detail"
          onClose={() => setSelectedDispute(null)}
        >
          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-4">
              <CaseBlock
                title="Case summary"
                lines={[
                  selectedDispute.reason,
                  selectedDispute.details || 'No details provided',
                  `Status: ${selectedDispute.status}`,
                ]}
              />
              <CaseBlock
                title="Accepted proposal"
                lines={[
                  selectedDispute.booking?.title || 'Booking reference',
                  formatMoney(selectedDispute.booking?.totalAmount),
                  selectedDispute.vendor?.businessName || 'Vendor',
                ]}
              />
              <CaseBlock
                title="Payments"
                lines={[
                  'Advance received',
                  'Milestone under review',
                  'Refund recommendation pending',
                ]}
              />
              <CaseBlock
                title="Internal admin notes"
                lines={[
                  'SLA timer active',
                  'Evidence count verified',
                  'Officer assignment recommended',
                ]}
              />
            </div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <h3 className="text-xl font-black text-slate-950">
                Resolution timeline
              </h3>
              <div className="mt-5 space-y-4">
                {[
                  'Case opened by customer',
                  'Vendor response requested',
                  'Payment schedule reviewed',
                  'Admin note added',
                  'Resolution pending',
                ].map((item, index) => (
                  <div key={item} className="flex gap-4">
                    <span className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#6E1738] text-xs font-black text-white">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-black text-slate-950">{item}</p>
                      <p className="text-sm text-slate-500">
                        {new Date(
                          Date.now() - index * 86400000,
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void action(
                      `/admin/disputes/${selectedDispute.id}`,
                      {
                        status: 'RESOLVED',
                        resolutionNote: 'Resolved by platform moderation.',
                      },
                      'Close case',
                    )
                  }
                  className="rounded-xl bg-[#6E1738] px-4 py-2 text-sm font-black text-white"
                >
                  Close case
                </button>
              </div>
            </div>
          </div>
        </ReviewDrawer>
      ) : null}
    </main>
  );
}

function pickSeverity(index: number) {
  return ['Low', 'Medium', 'High', 'Critical'][index % 4];
}

function ChartList({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, number]>;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">{title}</h2>
      <div className="mt-5 space-y-4">
        {rows.map(([label, value]) => (
          <div key={label}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-slate-600">{label}</span>
              <span className="font-black text-slate-950">{value}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-slate-500"
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QueueCard({
  title,
  count,
  rows,
  tone,
}: {
  title: string;
  count: number;
  rows: string[][];
  tone: string;
}) {
  const color =
    tone === 'rose'
      ? 'text-rose-700 bg-rose-50'
      : tone === 'amber'
        ? 'text-amber-700 bg-amber-50'
        : 'text-slate-700 bg-slate-50';
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-950">{title}</h2>
        <span className={`rounded-full px-3 py-1 text-sm font-black ${color}`}>
          {count}
        </span>
      </div>
      <div className="mt-5 space-y-3">
        {rows.length ? (
          rows.map((row, index) => (
            <div
              key={`${row[0]}-${index}`}
              className="rounded-xl border border-slate-200 p-3"
            >
              <p className="font-black text-slate-950">{row[0]}</p>
              <p className="mt-1 text-sm text-slate-500">
                {row[1]} - {row[2]}
              </p>
            </div>
          ))
        ) : (
          <EmptyState
            title="No items in queue."
            body="This queue is clear for the selected view."
          />
        )}
      </div>
    </div>
  );
}

function TableHeader({
  title,
  subtitle,
  actions,
  onExport,
}: {
  title: string;
  subtitle: string;
  actions: string[];
  onExport: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 p-6 xl:flex-row xl:items-center xl:justify-between">
      <div>
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions
          .filter((item) => item !== 'Export CSV')
          .map((item) => (
            <span
              key={item}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-600"
            >
              {item}
            </span>
          ))}
        <button
          type="button"
          onClick={onExport}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
        >
          Export CSV
        </button>
      </div>
    </div>
  );
}

function ReviewDrawer({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [onClose]);

  const titleId = `drawer-${title.toLowerCase().replaceAll(' ', '-')}`;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40"
        aria-label="Close drawer"
      />
      <aside className="absolute right-0 top-0 h-full w-full max-w-6xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#6E1738]">
              Detail drawer
            </p>
            <h2 id={titleId} className="text-2xl font-black text-slate-950">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700"
          >
            Close
          </button>
        </div>
        <div className="p-6">{children}</div>
      </aside>
    </div>
  );
}

function CaseBlock({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <h3 className="font-black text-slate-950">{title}</h3>
      <div className="mt-3 space-y-2">
        {lines.map((line) => (
          <p key={line} className="text-sm text-slate-600">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
