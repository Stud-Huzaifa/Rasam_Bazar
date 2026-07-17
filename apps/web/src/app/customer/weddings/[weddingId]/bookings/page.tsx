'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PlannerShell } from '../../../../components/planner-shell';
import { getJson, postJson } from '../../../../lib/api';

export default function WeddingBookingsPage({
  params,
}: {
  params: { weddingId: string };
}) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadBookings() {
    try {
      const data = await getJson(`/weddings/${params.weddingId}/bookings`);
      setBookings(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load bookings');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.weddingId]);

  async function action(path: string, body: unknown = {}) {
    await postJson(path, body);
    await loadBookings();
  }

  return (
    <PlannerShell weddingId={params.weddingId}>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-400">
              Bookings
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Vendor agreements</h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Accepted proposals become bookings with agreement text,
              milestones, and budget-linked payments.
            </p>
          </div>
          <Link
            href={`/customer/bookings?weddingId=${params.weddingId}`}
            className="rounded-lg border border-amber-400/40 px-4 py-2 text-sm font-medium text-amber-300 hover:bg-amber-400/10"
          >
            Payment tracker
          </Link>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-slate-400">Loading bookings...</p>
        ) : null}
        {error ? <p className="mt-6 text-sm text-rose-300">{error}</p> : null}

        <div className="mt-8 space-y-5">
          {bookings.map((booking) => {
            const paid =
              booking.payments
                ?.filter((payment: any) => payment.status === 'PAID')
                .reduce(
                  (sum: number, payment: any) =>
                    sum + Number(payment.amount || 0),
                  0,
                ) || 0;
            return (
              <article
                key={booking.id}
                className="rounded-2xl border border-white/10 bg-slate-900/70 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm text-amber-300">
                      {booking.serviceRequest?.category?.name ||
                        'Vendor booking'}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">
                      {booking.title}
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      {booking.status} - {booking.payments?.length || 0}{' '}
                      milestones - PKR {paid.toLocaleString()} paid
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        void action(`/bookings/${booking.id}/customer-confirm`)
                      }
                      className="rounded-lg border border-emerald-400/40 px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-400/10"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() =>
                        void action(`/bookings/${booking.id}/sync-budget`)
                      }
                      className="rounded-lg border border-amber-400/40 px-3 py-2 text-sm text-amber-300 hover:bg-amber-400/10"
                    >
                      Sync budget
                    </button>
                    <button
                      onClick={() =>
                        void action(`/bookings/${booking.id}/complete`)
                      }
                      className="rounded-lg border border-sky-400/40 px-3 py-2 text-sm text-sky-300 hover:bg-sky-400/10"
                    >
                      Complete
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {booking.payments?.map((payment: any) => (
                    <div
                      key={payment.id}
                      className="rounded-xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-medium">{payment.title}</h3>
                          <p className="mt-1 text-sm text-slate-400">
                            PKR {Number(payment.amount || 0).toLocaleString()} -{' '}
                            {payment.dueDate
                              ? new Date(payment.dueDate).toLocaleDateString()
                              : 'No due date'}
                          </p>
                        </div>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                          {payment.status}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          void action(
                            `/bookings/${booking.id}/payments/${payment.id}/mark-paid`,
                            { method: 'BANK_TRANSFER' },
                          )
                        }
                        className="mt-4 rounded-lg border border-emerald-400/40 px-3 py-1 text-sm text-emerald-300 hover:bg-emerald-400/10"
                      >
                        Mark paid
                      </button>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>

        {!loading && bookings.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300">
            Accept a proposal to create the first booking.
          </p>
        ) : null}
      </section>
    </PlannerShell>
  );
}
