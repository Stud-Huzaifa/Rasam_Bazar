'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { title: 'Dashboard', href: '/vendor/dashboard' },
  { title: 'Profile', href: '/vendor/profile' },
  { title: 'Verification', href: '/vendor/verification' },
  { title: 'Services', href: '/vendor/services' },
  { title: 'Packages', href: '/vendor/packages' },
  { title: 'Availability', href: '/vendor/availability' },
  { title: 'Inquiries', href: '/vendor/inquiries' },
  { title: 'Matching', href: '/vendor/matching-requests' },
  { title: 'Proposals', href: '/vendor/proposals' },
  { title: 'Bookings', href: '/vendor/bookings' },
  { title: 'Messages', href: '/vendor/messages' },
  { title: 'Reviews', href: '/vendor/reviews' },
];

export function VendorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
                Vendor studio
              </span>
            </span>
          </Link>
          <div className="mt-7 rounded-2xl bg-[var(--rb-ivory)] p-4">
            <p className="rb-kicker">Business tools</p>
            <h2 className="mt-2 text-2xl font-bold text-[var(--rb-burgundy-dark)] rb-serif">
              Growth workspace
            </h2>
            <p className="mt-2 text-sm font-semibold text-[var(--rb-muted)]">
              Leads, trust, packages, bookings, and reviews.
            </p>
          </div>
          <nav
            aria-label="Vendor workspace sections"
            className="mt-6 space-y-2"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? 'page' : undefined}
                className={`block rounded-xl border px-4 py-3 text-sm font-bold transition ${pathname === item.href ? 'border-[var(--rb-gold)] bg-[rgba(200,164,93,0.15)] text-[var(--rb-burgundy-dark)]' : 'border-transparent text-[var(--rb-muted)] hover:border-[var(--rb-border)] hover:bg-white'}`}
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
