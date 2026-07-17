'use client';

import { useEffect, useState } from 'react';
import { VendorShell } from '../../components/vendor-shell';
import { getJson } from '../../lib/api';

export default function VendorMatchingRequestsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadMatches() {
      try {
        const data = await getJson('/vendors/me/matching-requests');
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Could not load matching requests',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadMatches();
  }, []);

  return (
    <VendorShell>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-400">
              Matching requests
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              Public requirements that fit your services
            </h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Rule-based scoring uses category, location, availability, budget,
              verification, and capacity.
            </p>
          </div>
          <div className="rounded-full border border-amber-400/40 px-4 py-2 text-sm text-amber-300">
            {items.length} matches
          </div>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-slate-400">
            Loading matching requests...
          </p>
        ) : null}
        {error ? <p className="mt-6 text-sm text-rose-300">{error}</p> : null}

        <div className="mt-8 space-y-4">
          {items.map((item) => (
            <div
              key={item.request.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm text-amber-300">
                    {item.request.category?.name ||
                      item.request.visibility?.replaceAll('_', ' ')}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">
                    {item.request.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">
                    {item.request.city || 'City not set'} -{' '}
                    {item.request.guestCount || 0} guests - PKR{' '}
                    {Number(item.request.maxBudget || 0).toLocaleString()}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm text-emerald-300">
                  {item.match.score}% match
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-300">
                {item.request.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(item.match.reasons || []).map((reason: string) => (
                  <span
                    key={reason}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {!loading && items.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300">
            No matching public requests yet.
          </p>
        ) : null}
      </section>
    </VendorShell>
  );
}
