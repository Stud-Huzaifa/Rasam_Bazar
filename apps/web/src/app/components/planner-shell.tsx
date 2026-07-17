'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getJson } from '../lib/api';

const modules = [
  { title: 'Overview', href: '' },
  { title: 'Events', href: 'events' },
  { title: 'Planner', href: 'planner' },
  { title: 'Guests', href: 'guests' },
  { title: 'Budget', href: 'budget' },
  { title: 'Tasks', href: 'tasks' },
  { title: 'Members', href: 'members' },
  { title: 'Requests', href: 'service-requests' },
  { title: 'Bookings', href: 'bookings' },
  { title: 'Wedding day', href: 'wedding-day' },
  { title: 'Activity', href: 'activity' },
];

type WeddingSummary = {
  title?: string;
  brideName?: string | null;
  groomName?: string | null;
  city?: string | null;
  startDate?: string | null;
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

export function PlannerShell({
  weddingId,
  children,
}: {
  weddingId: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [wedding, setWedding] = useState<WeddingSummary | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadWedding() {
      try {
        const data = await getJson(`/weddings/${weddingId}`);
        if (isActive) {
          setWedding(data);
        }
      } catch {
        if (isActive) {
          setWedding(null);
        }
      }
    }

    void loadWedding();
    return () => {
      isActive = false;
    };
  }, [weddingId]);

  const displayTitle =
    wedding?.title ||
    [wedding?.brideName, wedding?.groomName].filter(Boolean).join(' & ') ||
    'Wedding planner';
  const displayMeta = `${formatDate(wedding?.startDate)}${wedding?.city ? ` in ${wedding.city}` : ''}`;

  return (
    <div id="main-content" className="rb-page px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row">
        <aside className="rb-card w-full p-6 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-72 lg:overflow-y-auto">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[var(--rb-burgundy)] text-lg font-black text-white rb-serif">
              R
            </span>
            <span>
              <span className="block text-lg font-black text-[var(--rb-burgundy-dark)] rb-serif">
                RasmBazaar
              </span>
              <span className="block text-xs font-bold text-[var(--rb-muted)]">
                Planning hub
              </span>
            </span>
          </Link>
          <div className="mt-7 rounded-2xl bg-[var(--rb-ivory)] p-4">
            <p className="rb-kicker">Wedding</p>
            <h2 className="mt-2 text-2xl font-bold text-[var(--rb-burgundy-dark)] rb-serif">
              {displayTitle}
            </h2>
            <p className="mt-2 text-sm font-semibold text-[var(--rb-muted)]">
              {displayMeta}
            </p>
          </div>
          <nav
            aria-label="Wedding planning sections"
            className="mt-6 space-y-2"
          >
            {modules.map((module) => {
              const href = module.href
                ? `/customer/weddings/${weddingId}/${module.href}`
                : `/customer/weddings/${weddingId}`;
              const active = pathname === href;
              return (
                <Link
                  key={module.title}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`block rounded-xl border px-4 py-3 text-sm font-bold transition ${active ? 'border-[var(--rb-gold)] bg-[rgba(200,164,93,0.15)] text-[var(--rb-burgundy-dark)]' : 'border-transparent text-[var(--rb-muted)] hover:border-[var(--rb-border)] hover:bg-white'}`}
                >
                  {module.title}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
