'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getJson, postJson } from '../../lib/api';

export default function CustomerBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [paymentForm, setPaymentForm] = useState({
    bookingId: '',
    title: '',
    amount: '',
    dueDate: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadBookings() {
    try {
      const data = await getJson('/customer/bookings');
      const weddingId =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('weddingId')
          : '';
      const bookingList = Array.isArray(data) ? data : [];
      setBookings(
        weddingId
          ? bookingList.filter((booking) => booking.weddingId === weddingId)
          : bookingList,
      );
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

  async function action(path: string, body: unknown = {}, label = 'Action') {
    try {
      setError('');
      setSuccess('');
      await postJson(path, body);
      setSuccess(`${label} completed.`);
      await loadBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : `${label} failed`);
    }
  }

  async function addPayment(event: React.FormEvent) {
    event.preventDefault();
    if (!paymentForm.bookingId || !paymentForm.title || !paymentForm.amount) {
      setError('Select a booking, milestone title, and amount.');
      return;
    }
    await action(
      `/bookings/${paymentForm.bookingId}/payments`,
      {
        title: paymentForm.title,
        amount: Number(paymentForm.amount),
        dueDate: paymentForm.dueDate || undefined,
      },
      'Payment milestone',
    );
    setPaymentForm((current) => ({
      bookingId: current.bookingId,
      title: '',
      amount: '',
      dueDate: '',
    }));
  }

  return (
    <main id="main-content" className="rb-page px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="rb-kicker">Bookings</p>
            <h1 className="rb-heading mt-2 text-6xl">
              Agreements and payments
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-[var(--rb-muted)]">
              Track accepted vendors, agreement confirmation, payment
              milestones, and budget sync.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/customer/messages"
              className="rb-button rb-button-secondary"
            >
              Messages
            </Link>
            <Link
              href="/customer/reviews"
              className="rb-button rb-button-secondary"
            >
              Leave reviews
            </Link>
            <Link
              href="/customer/proposals"
              className="rb-button rb-button-primary"
            >
              Compare Karein
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="mt-8 text-sm text-[var(--rb-muted)]">
            Loading bookings...
          </p>
        ) : null}
        {error ? (
          <p className="mt-8 rb-card border-[var(--rb-error)] p-4 text-sm font-semibold text-[var(--rb-error)]">
            <span role="alert">{error}</span>
          </p>
        ) : null}
        {success ? (
          <p role="status" aria-live="polite" className="mt-8 rb-success">
            {success}
          </p>
        ) : null}

        <form
          onSubmit={addPayment}
          className="mt-8 grid gap-3 rb-card p-5 md:grid-cols-4"
        >
          <select
            value={paymentForm.bookingId}
            onChange={(event) =>
              setPaymentForm((current) => ({
                ...current,
                bookingId: event.target.value,
              }))
            }
            className="rb-input"
            aria-label="Booking"
            required
          >
            <option value="">Select booking</option>
            {bookings.map((booking) => (
              <option key={booking.id} value={booking.id}>
                {booking.title}
              </option>
            ))}
          </select>
          <input
            value={paymentForm.title}
            onChange={(event) =>
              setPaymentForm((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
            placeholder="Milestone title"
            className="rb-input"
            aria-label="Milestone title"
            required
          />
          <input
            value={paymentForm.amount}
            onChange={(event) =>
              setPaymentForm((current) => ({
                ...current,
                amount: event.target.value,
              }))
            }
            placeholder="Amount"
            type="number"
            className="rb-input"
            min="1"
            aria-label="Amount"
            required
          />
          <div className="flex gap-3">
            <input
              value={paymentForm.dueDate}
              onChange={(event) =>
                setPaymentForm((current) => ({
                  ...current,
                  dueDate: event.target.value,
                }))
              }
              type="date"
              className="rb-input min-w-0 flex-1"
              aria-label="Due date"
            />
            <button type="submit" className="rb-button rb-button-primary">
              Add
            </button>
          </div>
        </form>

        <div className="mt-8 grid gap-6">
          {bookings.map((booking) => {
            const paid =
              booking.payments
                ?.filter((payment: any) => payment.status === 'PAID')
                .reduce(
                  (sum: number, payment: any) =>
                    sum + Number(payment.amount || 0),
                  0,
                ) || 0;
            const total = Number(booking.totalAmount || 0);
            return (
              <section key={booking.id} className="rb-card p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-bold text-[var(--rb-burgundy)]">
                      {booking.vendor?.businessName}
                    </p>
                    <h2 className="mt-1 text-3xl font-bold text-[var(--rb-burgundy-dark)] rb-serif">
                      {booking.title}
                    </h2>
                    <p className="mt-2 text-sm text-[var(--rb-muted)]">
                      {booking.status} - PKR {paid.toLocaleString()} of{' '}
                      {total.toLocaleString()} paid
                    </p>
                    {booking.agreementText ? (
                      <pre className="mt-4 max-w-3xl whitespace-pre-wrap rounded-xl border border-[var(--rb-border)] bg-[var(--rb-ivory)] p-4 text-sm text-[var(--rb-muted)]">
                        {booking.agreementText}
                      </pre>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        void action(`/bookings/${booking.id}/customer-confirm`)
                      }
                      className="rb-badge rb-status-success"
                    >
                      Booking Confirm Karein
                    </button>
                    <button
                      onClick={() =>
                        void action(
                          `/bookings/${booking.id}/sync-budget`,
                          {},
                          'Budget sync',
                        )
                      }
                      className="rb-badge"
                    >
                      Sync budget
                    </button>
                    <button
                      onClick={() =>
                        void action(
                          `/bookings/${booking.id}/cancel`,
                          {
                            reason: 'Cancelled by customer',
                          },
                          'Booking cancellation',
                        )
                      }
                      className="rb-badge rb-status-danger"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                <div className="mt-5 overflow-x-auto">
                  <table className="rb-table min-w-full text-sm">
                    <thead>
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
                        <tr key={payment.id}>
                          <td className="py-3 pr-4">{payment.title}</td>
                          <td className="py-3 pr-4">
                            PKR {Number(payment.amount || 0).toLocaleString()}
                          </td>
                          <td className="py-3 pr-4">
                            {payment.dueDate
                              ? new Date(payment.dueDate).toLocaleDateString()
                              : 'Not set'}
                          </td>
                          <td className="py-3 pr-4">
                            <span className="rb-badge">{payment.status}</span>
                          </td>
                          <td className="py-3 pr-4">
                            <button
                              onClick={() =>
                                void action(
                                  `/bookings/${booking.id}/payments/${payment.id}/mark-paid`,
                                  { method: 'BANK_TRANSFER' },
                                  'Payment record',
                                )
                              }
                              className="rb-badge rb-status-success"
                            >
                              Mark paid
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>

        {!loading && bookings.length === 0 ? (
          <p className="mt-8 rb-empty">
            Abhi tak koi vendor select nahi hua. Chaliye shuru karte hain.
          </p>
        ) : null}
      </div>
    </main>
  );
}
