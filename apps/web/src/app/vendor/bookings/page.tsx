'use client';

import { useEffect, useState } from 'react';
import { VendorShell } from '../../components/vendor-shell';
import { getJson, postJson } from '../../lib/api';

export default function VendorBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadBookings() {
    try {
      const data = await getJson('/vendor/bookings');
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
  }, []);

  async function action(path: string, body: unknown = {}) {
    await postJson(path, body);
    await loadBookings();
  }

  return (
    <VendorShell>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-400">
          Bookings
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          Confirmed work and payments
        </h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          Manage accepted proposals after they become bookings, confirm
          agreement terms, and track manual payment milestones.
        </p>

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
                      {booking.serviceRequest?.title}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">
                      {booking.customer?.fullName || booking.customer?.email}
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      {booking.status} - PKR {paid.toLocaleString()} of{' '}
                      {Number(booking.totalAmount || 0).toLocaleString()}{' '}
                      received
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        void action(`/bookings/${booking.id}/vendor-confirm`)
                      }
                      className="rounded-lg border border-emerald-400/40 px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-400/10"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() =>
                        void action(`/bookings/${booking.id}/start`)
                      }
                      className="rounded-lg border border-sky-400/40 px-3 py-2 text-sm text-sky-300 hover:bg-sky-400/10"
                    >
                      Start
                    </button>
                    <button
                      onClick={() =>
                        void action(`/bookings/${booking.id}/complete`)
                      }
                      className="rounded-lg border border-amber-400/40 px-3 py-2 text-sm text-amber-300 hover:bg-amber-400/10"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() =>
                        void action(`/bookings/${booking.id}/cancel`, {
                          reason: 'Cancelled by vendor',
                        })
                      }
                      className="rounded-lg border border-rose-400/40 px-3 py-2 text-sm text-rose-300 hover:bg-rose-400/10"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                {booking.agreementText ? (
                  <pre className="mt-5 max-w-4xl whitespace-pre-wrap rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                    {booking.agreementText}
                  </pre>
                ) : null}

                <div className="mt-5 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-slate-400">
                      <tr>
                        <th className="py-2 pr-4">Milestone</th>
                        <th className="py-2 pr-4">Amount</th>
                        <th className="py-2 pr-4">Due</th>
                        <th className="py-2 pr-4">Status</th>
                        <th className="py-2 pr-4">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {booking.payments?.map((payment: any) => (
                        <tr
                          key={payment.id}
                          className="border-t border-white/10"
                        >
                          <td className="py-3 pr-4">{payment.title}</td>
                          <td className="py-3 pr-4">
                            PKR {Number(payment.amount || 0).toLocaleString()}
                          </td>
                          <td className="py-3 pr-4">
                            {payment.dueDate
                              ? new Date(payment.dueDate).toLocaleDateString()
                              : 'Not set'}
                          </td>
                          <td className="py-3 pr-4">{payment.status}</td>
                          <td className="py-3 pr-4">
                            <button
                              onClick={() =>
                                void action(
                                  `/bookings/${booking.id}/payments/${payment.id}/mark-paid`,
                                  { method: 'BANK_TRANSFER' },
                                )
                              }
                              className="rounded border border-emerald-400/40 px-2 py-1 text-emerald-300"
                            >
                              Mark paid
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            );
          })}
        </div>

        {!loading && bookings.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300">
            Accepted customer proposals will appear here as bookings.
          </p>
        ) : null}
      </section>
    </VendorShell>
  );
}
