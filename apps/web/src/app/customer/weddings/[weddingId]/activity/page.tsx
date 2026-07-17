'use client';

import { useEffect, useState } from 'react';
import { PlannerShell } from '../../../../components/planner-shell';
import { getJson } from '../../../../lib/api';

export default function WeddingActivityPage({
  params,
}: {
  params: { weddingId: string };
}) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadActivity() {
      try {
        const data = await getJson(`/weddings/${params.weddingId}/activity`);
        setEvents(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Could not load activity',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadActivity();
  }, [params.weddingId]);

  return (
    <PlannerShell weddingId={params.weddingId}>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-400">
          Activity
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Planner history</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          A running record of booking, payment, message, review, and planning
          updates for this wedding.
        </p>

        {loading ? (
          <p className="mt-6 text-sm text-slate-400">Loading activity...</p>
        ) : null}
        {error ? <p className="mt-6 text-sm text-rose-300">{error}</p> : null}

        <div className="mt-8 space-y-4">
          {events.map((event) => (
            <article
              key={event.id}
              className="rounded-2xl border border-white/10 bg-slate-900/70 p-5"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm text-amber-300">
                    {event.type?.replaceAll('_', ' ')}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">{event.title}</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    {event.body || event.entityType}
                  </p>
                </div>
                <span className="text-sm text-slate-500">
                  {new Date(event.createdAt).toLocaleString()}
                </span>
              </div>
              {event.actor ? (
                <p className="mt-3 text-sm text-slate-500">
                  By {event.actor.fullName || event.actor.email}
                </p>
              ) : null}
            </article>
          ))}
        </div>

        {!loading && events.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300">
            No activity recorded yet.
          </p>
        ) : null}
      </section>
    </PlannerShell>
  );
}
