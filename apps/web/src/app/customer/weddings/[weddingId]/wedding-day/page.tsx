'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PlannerShell } from '../../../../components/planner-shell';
import { getJson } from '../../../../lib/api';

type Wedding = {
  title?: string;
  city?: string | null;
  startDate?: string | null;
};

type Task = {
  id: string;
  title: string;
  status?: string;
  dueDate?: string | null;
  isCompleted?: boolean;
};

type Booking = {
  id: string;
  weddingId?: string;
  title: string;
  status?: string;
  vendor?: { businessName?: string };
  payments?: Array<{
    id: string;
    title: string;
    amount?: number | string;
    status?: string;
  }>;
};

function formatDate(date?: string | null) {
  if (!date) return 'Wedding date not set';
  return new Date(date).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function WeddingDayPage({
  params,
}: {
  params: { weddingId: string };
}) {
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    async function loadOps() {
      try {
        const [weddingData, taskData, bookingData] = await Promise.all([
          getJson(`/weddings/${params.weddingId}`),
          getJson(`/weddings/${params.weddingId}/tasks`),
          getJson('/customer/bookings'),
        ]);

        if (isActive) {
          setWedding(weddingData);
          setTasks(Array.isArray(taskData) ? taskData : []);
          setBookings(
            Array.isArray(bookingData)
              ? bookingData.filter(
                  (booking) =>
                    booking.weddingId === params.weddingId ||
                    !booking.weddingId,
                )
              : [],
          );
          setError('');
        }
      } catch (err) {
        if (isActive) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load wedding-day operations',
          );
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadOps();
    return () => {
      isActive = false;
    };
  }, [params.weddingId]);

  const openTasks = tasks
    .filter((task) => !task.isCompleted && task.status !== 'COMPLETED')
    .slice(0, 6);
  const paymentDue = bookings
    .flatMap((booking) => booking.payments || [])
    .filter((payment) => payment.status !== 'PAID');

  return (
    <PlannerShell weddingId={params.weddingId}>
      <section className="mx-auto max-w-3xl space-y-5">
        <div className="rb-card overflow-hidden">
          <div className="bg-[var(--rb-burgundy-dark)] p-6 text-white">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--rb-gold)]">
              Wedding day ops
            </p>
            <h1 className="mt-3 text-4xl font-bold rb-serif">
              {wedding?.title || 'Live wedding run sheet'}
            </h1>
            <p className="mt-2 text-sm font-semibold text-white/70">
              {loading
                ? 'Loading live checklist...'
                : `${formatDate(wedding?.startDate)}${wedding?.city ? ` in ${wedding.city}` : ''}`}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-px bg-[var(--rb-border)] text-center">
            <div className="bg-white p-4">
              <p className="text-2xl font-black text-[var(--rb-burgundy)]">
                {openTasks.length}
              </p>
              <p className="text-xs font-bold text-[var(--rb-muted)]">
                Open tasks
              </p>
            </div>
            <div className="bg-white p-4">
              <p className="text-2xl font-black text-[var(--rb-success)]">
                {bookings.length}
              </p>
              <p className="text-xs font-bold text-[var(--rb-muted)]">
                Vendors
              </p>
            </div>
            <div className="bg-white p-4">
              <p className="text-2xl font-black text-[var(--rb-warning)]">
                {paymentDue.length}
              </p>
              <p className="text-xs font-bold text-[var(--rb-muted)]">
                Payments
              </p>
            </div>
          </div>
        </div>

        {error ? (
          <p className="rb-card border-[var(--rb-error)] p-4 text-sm font-semibold text-[var(--rb-error)]">
            {error}
          </p>
        ) : null}

        <section className="rb-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-[var(--rb-burgundy-dark)] rb-serif">
              Priority checklist
            </h2>
            <Link
              href={`/customer/weddings/${params.weddingId}/tasks`}
              className="text-sm font-bold text-[var(--rb-burgundy)]"
            >
              All tasks
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {openTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-xl border border-[var(--rb-border)] bg-[var(--rb-ivory)] p-4"
              >
                <p className="font-bold text-[var(--rb-burgundy-dark)]">
                  {task.title}
                </p>
                <p className="mt-1 text-sm text-[var(--rb-muted)]">
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString()
                    : 'No due date'}{' '}
                  | {task.status || 'NOT_STARTED'}
                </p>
              </div>
            ))}
            {!loading && openTasks.length === 0 ? (
              <p className="text-sm text-[var(--rb-muted)]">
                No open priority tasks.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rb-card p-5">
          <h2 className="text-2xl font-bold text-[var(--rb-burgundy-dark)] rb-serif">
            Vendor contacts
          </h2>
          <div className="mt-4 space-y-3">
            {bookings.slice(0, 6).map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--rb-border)] bg-white p-4"
              >
                <div>
                  <p className="font-bold text-[var(--rb-burgundy-dark)]">
                    {booking.vendor?.businessName || booking.title}
                  </p>
                  <p className="mt-1 text-sm text-[var(--rb-muted)]">
                    {booking.status || 'BOOKED'}
                  </p>
                </div>
                <Link
                  href="/customer/messages"
                  className="rb-button rb-button-secondary min-h-10 px-3 py-2 text-sm"
                >
                  Message
                </Link>
              </div>
            ))}
            {!loading && bookings.length === 0 ? (
              <p className="text-sm text-[var(--rb-muted)]">
                No bookings connected yet.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rb-card p-5">
          <h2 className="text-2xl font-bold text-[var(--rb-burgundy-dark)] rb-serif">
            Payment reminders
          </h2>
          <div className="mt-4 space-y-3">
            {paymentDue.slice(0, 5).map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--rb-border)] bg-[var(--rb-ivory)] p-4"
              >
                <div>
                  <p className="font-bold text-[var(--rb-burgundy-dark)]">
                    {payment.title}
                  </p>
                  <p className="mt-1 text-sm text-[var(--rb-muted)]">
                    PKR {Number(payment.amount || 0).toLocaleString()}
                  </p>
                </div>
                <span className="rb-badge rb-status-warning">
                  {payment.status || 'PENDING'}
                </span>
              </div>
            ))}
            {!loading && paymentDue.length === 0 ? (
              <p className="text-sm text-[var(--rb-muted)]">
                No unpaid milestones.
              </p>
            ) : null}
          </div>
        </section>
      </section>
    </PlannerShell>
  );
}
