'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { VendorShell } from '../../components/vendor-shell';
import { getJson } from '../../lib/api';
import { demoVendorDashboard } from '../../lib/demo-session';

type Dashboard = {
  vendor?: any;
  metrics?: Record<string, any>;
  upcomingAvailability?: any[];
};

export default function VendorDashboardPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await getJson('/vendors/me/dashboard');
        setDashboard(data);
      } catch (err) {
        setDashboard(demoVendorDashboard);
        setError('');
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  const metrics = dashboard?.metrics || {};

  return (
    <VendorShell>
      <section className="rb-card p-8 md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="rb-kicker">Vendor dashboard</p>
            <h1 className="rb-heading mt-2 text-5xl">
              {dashboard?.vendor?.businessName || 'Your vendor workspace'}
            </h1>
            <p className="mt-4 max-w-2xl text-[var(--rb-muted)]">
              Manage the vendor profile customers will use to evaluate your
              services and trust level.
            </p>
          </div>
          <Link href="/marketplace" className="rb-button rb-button-secondary">
            View marketplace
          </Link>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-[var(--rb-muted)]">
            Loading vendor dashboard...
          </p>
        ) : null}
        {error ? (
          <p className="mt-6 rounded-2xl border border-[rgba(180,58,75,0.28)] bg-[rgba(180,58,75,0.1)] p-4 text-sm font-semibold text-[var(--rb-error)]">
            {error}
          </p>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rb-card-soft p-5">
            <p className="text-sm font-bold text-[var(--rb-muted)]">
              Verification
            </p>
            <p className="mt-2 text-xl font-black text-[var(--rb-burgundy)]">
              {metrics.verificationLevel || 'UNVERIFIED'}
            </p>
          </div>
          <div className="rb-card-soft p-5">
            <p className="text-sm font-bold text-[var(--rb-muted)]">Services</p>
            <p className="mt-2 text-3xl font-black text-[var(--rb-success)]">
              {metrics.activeServices || 0}
            </p>
          </div>
          <div className="rb-card-soft p-5">
            <p className="text-sm font-bold text-[var(--rb-muted)]">Packages</p>
            <p className="mt-2 text-3xl font-black text-[var(--rb-info)]">
              {metrics.activePackages || 0}
            </p>
          </div>
          <div className="rb-card-soft p-5">
            <p className="text-sm font-bold text-[var(--rb-muted)]">Teams</p>
            <p className="mt-2 text-3xl font-black text-[var(--rb-warning)]">
              {metrics.teams || 0}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Link
            href="/vendor/reviews"
            className="rb-card p-5 transition hover:-translate-y-1"
          >
            <p className="text-sm font-bold text-[var(--rb-muted)]">
              Trust score
            </p>
            <p className="mt-2 text-3xl font-black text-[var(--rb-success)]">
              {metrics.trustScore || 0}
            </p>
          </Link>
          <Link
            href="/vendor/reviews"
            className="rb-card p-5 transition hover:-translate-y-1"
          >
            <p className="text-sm font-bold text-[var(--rb-muted)]">
              Average rating
            </p>
            <p className="mt-2 text-3xl font-black text-[var(--rb-warning)]">
              {metrics.averageRating || 'N/A'}
            </p>
          </Link>
          <Link
            href="/vendor/reviews"
            className="rb-card p-5 transition hover:-translate-y-1"
          >
            <p className="text-sm font-bold text-[var(--rb-muted)]">Reviews</p>
            <p className="mt-2 text-3xl font-black text-[var(--rb-info)]">
              {metrics.reviewCount || 0}
            </p>
          </Link>
          <Link
            href="/vendor/bookings"
            className="rb-card p-5 transition hover:-translate-y-1"
          >
            <p className="text-sm font-bold text-[var(--rb-muted)]">
              Open disputes
            </p>
            <p className="mt-2 text-3xl font-black text-[var(--rb-error)]">
              {metrics.openDisputes || 0}
            </p>
          </Link>
        </div>
      </section>
    </VendorShell>
  );
}
