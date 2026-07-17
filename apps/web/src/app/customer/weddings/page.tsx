'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getJson } from '../../lib/api';
import { demoWeddings } from '../../lib/demo-session';

type Wedding = {
  id: string;
  title: string;
  brideName?: string | null;
  groomName?: string | null;
  city?: string | null;
  startDate?: string | null;
  status?: string;
};

function formatDate(date?: string | null) {
  if (!date) {
    return 'Date not set';
  }

  return new Date(date).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatStatus(status?: string) {
  return (status || 'DRAFT').replaceAll('_', ' ').toLowerCase();
}

export default function WeddingsPage() {
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    async function loadWeddings() {
      try {
        setLoading(true);
        const data = await getJson('/weddings');
        if (isActive) {
          setWeddings(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isActive) {
          setWeddings(demoWeddings);
          setError('');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadWeddings();
    return () => {
      isActive = false;
    };
  }, []);

  return (
    <main
      id="main-content"
      className="min-h-screen bg-slate-950 px-6 py-16 text-white"
    >
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-400">
              Wedding hub
            </p>
            <h1 className="mt-2 text-4xl font-semibold">
              Plan your big day with clarity
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-300">
              Create wedding profiles, manage events, and keep your family on
              the same page from engagement to celebration.
            </p>
          </div>
          <Link
            href="/customer/weddings/new"
            className="rounded-full bg-amber-500 px-5 py-3 text-center font-medium text-slate-950 transition hover:bg-amber-400"
          >
            Create wedding
          </Link>
        </div>

        {error ? (
          <p className="mt-8 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
          </p>
        ) : null}
        {loading ? (
          <p className="mt-8 text-sm text-slate-400">Loading weddings...</p>
        ) : null}

        {!loading && weddings.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-white/20 bg-white/5 p-8">
            <h2 className="text-xl font-semibold">No wedding profiles yet</h2>
            <p className="mt-3 max-w-2xl text-slate-300">
              Start with the core details, then add guests, budget items, and
              planning tasks from the dashboard.
            </p>
            <Link
              href="/customer/weddings/new"
              className="mt-6 inline-block rounded-lg bg-amber-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-amber-400"
            >
              Start planning
            </Link>
          </div>
        ) : null}

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {weddings.map((wedding) => (
            <Link
              key={wedding.id}
              href={`/customer/weddings/${wedding.id}`}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-amber-400/50 hover:bg-white/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{wedding.title}</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    {[wedding.brideName, wedding.groomName]
                      .filter(Boolean)
                      .join(' & ') || 'Couple details not set'}
                  </p>
                </div>
                <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs capitalize text-amber-300">
                  {formatStatus(wedding.status)}
                </span>
              </div>
              <p className="mt-6 text-sm text-slate-300">
                {formatDate(wedding.startDate)}
                {wedding.city ? ` - ${wedding.city}` : ''}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
