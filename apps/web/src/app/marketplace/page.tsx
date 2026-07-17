'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getJson } from '../lib/api';
import { demoCategories, filterDemoVendors } from '../lib/demo-data';

type Category = {
  id: string;
  name: string;
  slug: string;
  vendorCount?: number;
};

type Vendor = {
  id: string;
  businessName: string;
  description?: string | null;
  city?: string | null;
  serviceAreas?: string[];
  startingPrice?: number | string | null;
  verificationLevel?: string;
  services?: Array<{ title: string; category?: { name: string } | null }>;
  availability?: Array<{ status: string; date: string }>;
  trustFactors?: Record<string, any>;
};

const sorts = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price low to high' },
  { value: 'price_desc', label: 'Price high to low' },
];

const availabilityStatuses = [
  'AVAILABLE',
  'PARTIALLY_AVAILABLE',
  'TENTATIVELY_RESERVED',
  'BOOKED',
  'UNAVAILABLE',
];

function prettify(value?: string | null) {
  return value ? value.replaceAll('_', ' ') : 'Ask availability';
}

function initialParam(key: string) {
  if (typeof window === 'undefined') {
    return '';
  }

  return new URLSearchParams(window.location.search).get(key) || '';
}

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debounced;
}

export default function MarketplacePage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState({
    q: initialParam('q'),
    city: initialParam('city'),
    category: '',
    date: initialParam('date'),
    minPrice: '',
    maxPrice: '',
    minRating: '',
    capacity: '',
    verificationStatus: '',
    verificationLevel: '',
    availability: '',
    sort: 'newest',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const debouncedFilters = useDebouncedValue(filters);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(debouncedFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString();
  }, [debouncedFilters]);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const data = await getJson('/categories');
        setCategories(Array.isArray(data) ? data : []);
      } catch {
        setCategories(demoCategories);
      }
    }

    void loadInitialData();
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadVendors() {
      try {
        setLoading(true);
        const data = await getJson(
          `/vendors${queryString ? `?${queryString}` : ''}`,
        );
        if (isActive) {
          setVendors(Array.isArray(data) ? data : []);
          setError('');
        }
      } catch (err) {
        if (isActive) {
          setVendors(filterDemoVendors(debouncedFilters));
          setCategories((current) =>
            current.length ? current : demoCategories,
          );
          setError('');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadVendors();
    return () => {
      isActive = false;
    };
  }, [debouncedFilters, queryString]);

  function updateFilter(key: string, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <main id="main-content" className="rb-page">
      <header className="border-b border-[var(--rb-border)] bg-[rgba(255,249,243,0.9)] backdrop-blur-xl">
        <div className="rb-container flex min-h-20 items-center justify-between gap-4">
          <Link
            href="/"
            className="text-2xl font-black text-[var(--rb-burgundy-dark)] rb-serif"
          >
            RasmBazaar
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/categories" className="rb-button rb-button-secondary">
              Categories
            </Link>
            <Link
              href="/customer/weddings/new"
              className="rb-button rb-button-primary"
            >
              Planning Shuru Karein
            </Link>
          </div>
        </div>
      </header>

      <section className="rb-container py-10">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <aside className="rb-card h-fit p-6 lg:sticky lg:top-6">
            <p className="rb-kicker">Apne sheher ke verified wedding vendors</p>
            <h1 className="rb-heading mt-3 text-5xl">
              Vendor talash karein, tension nahi.
            </h1>
            <p className="mt-4 text-sm leading-6 text-[var(--rb-muted)]">
              City, date, service, capacity, price aur trust level ke filters
              use karein. Har card quote mangwane se pehle clear comparison ke
              liye tayyar hai.
            </p>

            <div className="mt-7 grid gap-3">
              <input
                value={filters.q}
                onChange={(event) => updateFilter('q', event.target.value)}
                placeholder="Search vendors or services"
                aria-label="Search vendors or services"
                className="rb-input"
              />
              <input
                value={filters.city}
                onChange={(event) => updateFilter('city', event.target.value)}
                placeholder="City or service area"
                aria-label="City or service area"
                className="rb-input"
              />
              <select
                value={filters.category}
                onChange={(event) =>
                  updateFilter('category', event.target.value)
                }
                className="rb-input"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
              <input
                value={filters.date}
                onChange={(event) => updateFilter('date', event.target.value)}
                type="date"
                aria-label="Event date"
                className="rb-input"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={filters.minPrice}
                  onChange={(event) =>
                    updateFilter('minPrice', event.target.value)
                  }
                  placeholder="Min price"
                  type="number"
                  aria-label="Minimum price"
                  className="rb-input"
                />
                <input
                  value={filters.maxPrice}
                  onChange={(event) =>
                    updateFilter('maxPrice', event.target.value)
                  }
                  placeholder="Max price"
                  type="number"
                  aria-label="Maximum price"
                  className="rb-input"
                />
              </div>
              <input
                value={filters.minRating}
                onChange={(event) =>
                  updateFilter('minRating', event.target.value)
                }
                placeholder="Minimum rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                aria-label="Minimum rating"
                className="rb-input"
              />
              <select
                value={filters.verificationStatus}
                onChange={(event) =>
                  updateFilter('verificationStatus', event.target.value)
                }
                className="rb-input"
              >
                <option value="">Any status</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
                <option value="MORE_INFORMATION_REQUIRED">
                  More information required
                </option>
                <option value="REJECTED">Rejected</option>
              </select>
              <input
                value={filters.capacity}
                onChange={(event) =>
                  updateFilter('capacity', event.target.value)
                }
                placeholder="Guest capacity"
                type="number"
                aria-label="Guest capacity"
                className="rb-input"
              />
              <select
                value={filters.verificationLevel}
                onChange={(event) =>
                  updateFilter('verificationLevel', event.target.value)
                }
                className="rb-input"
              >
                <option value="">Any verification</option>
                <option value="UNVERIFIED">Unverified</option>
                <option value="PHONE_VERIFIED">Phone verified</option>
                <option value="IDENTITY_VERIFIED">Identity verified</option>
                <option value="BUSINESS_VERIFIED">Business verified</option>
                <option value="PLATFORM_TRUSTED">Platform trusted</option>
              </select>
              <select
                value={filters.availability}
                onChange={(event) =>
                  updateFilter('availability', event.target.value)
                }
                className="rb-input"
              >
                <option value="">Any availability</option>
                {availabilityStatuses.map((status) => (
                  <option key={status} value={status}>
                    {prettify(status)}
                  </option>
                ))}
              </select>
              <select
                value={filters.sort}
                onChange={(event) => updateFilter('sort', event.target.value)}
                className="rb-input"
              >
                {sorts.map((sort) => (
                  <option key={sort.value} value={sort.value}>
                    {sort.label}
                  </option>
                ))}
              </select>
            </div>
          </aside>

          <div>
            <div className="flex flex-col gap-3 rounded-3xl bg-[var(--rb-burgundy-dark)] p-6 text-white sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--rb-gold)]">
                  Har faisla soch samajh kar
                </p>
                <h2 className="mt-2 text-3xl font-bold rb-serif">
                  {loading
                    ? 'Vendors talash ho rahe hain'
                    : `${vendors.length} vendors mil gaye`}
                </h2>
              </div>
              <span className="text-sm font-semibold text-white/70">
                Profiles, packages, availability aur reviews ek nazar mein
              </span>
            </div>

            {error ? (
              <p className="mt-6 rb-card border-[var(--rb-error)] p-4 text-sm font-semibold text-[var(--rb-error)]">
                {error}
              </p>
            ) : null}
            {loading ? (
              <div className="mt-6 rb-skeleton h-44 rounded-3xl" />
            ) : null}

            <div className="mt-6 grid gap-5">
              {vendors.map((vendor, index) => (
                <Link
                  key={vendor.id}
                  href={`/vendors/${vendor.id}`}
                  className="rb-card grid overflow-hidden transition hover:-translate-y-1 hover:shadow-2xl md:grid-cols-[220px_1fr]"
                >
                  <div
                    className="min-h-52 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(https://images.unsplash.com/photo-${index % 2 === 0 ? '1464366400600-7168b8af9bc3' : '1519741497674-611481863552'}?auto=format&fit=crop&w=700&q=80)`,
                    }}
                  />
                  <div className="p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="rb-kicker">
                          {vendor.services?.[0]?.category?.name ||
                            vendor.services?.[0]?.title ||
                            'Wedding vendor'}
                        </p>
                        <h2 className="mt-2 text-3xl font-bold text-[var(--rb-burgundy-dark)] rb-serif">
                          {vendor.businessName}
                        </h2>
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--rb-muted)]">
                          {vendor.description ||
                            'Shaadi ke liye trusted service provider.'}
                        </p>
                      </div>
                      <span className="rb-badge">
                        {prettify(vendor.verificationLevel)}
                      </span>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-4">
                      <span className="rb-card-soft p-3 text-sm font-bold text-[var(--rb-muted)]">
                        {vendor.city || vendor.serviceAreas?.[0] || 'Pakistan'}
                      </span>
                      <span className="rb-card-soft p-3 text-sm font-bold text-[var(--rb-success)]">
                        Trust {vendor.trustFactors?.trustScore || 0}
                      </span>
                      <span className="rb-card-soft p-3 text-sm font-bold text-[var(--rb-warning)]">
                        {vendor.trustFactors?.averageRating || 'N/A'} rating
                      </span>
                      <span className="rb-card-soft p-3 text-sm font-bold text-[var(--rb-burgundy)]">
                        PKR {Number(vendor.startingPrice || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {(vendor.services || []).slice(0, 3).map((service) => (
                        <span key={service.title} className="rb-badge bg-white">
                          {service.title}
                        </span>
                      ))}
                      <span className="rb-badge rb-status-success">
                        {prettify(vendor.availability?.[0]?.status)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {!loading && vendors.length === 0 ? (
              <p className="mt-6 rb-card p-6 text-[var(--rb-muted)]">
                Filhaal is filter par koi vendor nahi mila. Filters halka sa
                change karein, ya categories browse karein.
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
