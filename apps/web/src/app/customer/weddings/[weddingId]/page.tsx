'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PlannerShell } from '../../../components/planner-shell';
import { deleteJson, getJson, patchJson } from '../../../lib/api';
import { demoWeddings } from '../../../lib/demo-session';

type Wedding = {
  title?: string;
  brideName?: string | null;
  groomName?: string | null;
  city?: string | null;
  startDate?: string | null;
};

type Guest = {
  status?: string;
};

type BudgetItem = {
  amount?: number | string | null;
  isPaid?: boolean;
};

type Task = {
  status?: string;
  isCompleted?: boolean;
};

const modules = [
  {
    title: 'Events',
    href: 'events',
    description:
      'Build the desi event schedule with venue, timing, and guest counts.',
  },
  {
    title: 'Planner',
    href: 'planner',
    description:
      'Generate a guided plan with dependencies, approvals, and evidence.',
  },
  {
    title: 'Guests',
    href: 'guests',
    description: 'Track RSVPs, contact details, and invitation progress.',
  },
  {
    title: 'Budget',
    href: 'budget',
    description: 'Monitor expected costs and what has already been paid.',
  },
  {
    title: 'Tasks',
    href: 'tasks',
    description: 'Assign work, update progress, and close planning loops.',
  },
  {
    title: 'Members',
    href: 'members',
    description: 'Invite family members and assign planning responsibilities.',
  },
  {
    title: 'Requests',
    href: 'service-requests',
    description: 'Publish vendor requirements and invite matching businesses.',
  },
  {
    title: 'Bookings',
    href: 'bookings',
    description: 'Review accepted vendors, agreements, and payment milestones.',
  },
  {
    title: 'Wedding day',
    href: 'wedding-day',
    description:
      'Mobile-first run sheet for arrivals, payments, contacts, and live issues.',
  },
  {
    title: 'Activity',
    href: 'activity',
    description: 'Follow booking, payment, message, and review history.',
  },
];

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

function getDemoWedding(weddingId: string) {
  return (
    demoWeddings.find((item) => item.id === weddingId) ??
    (weddingId === 'demo123' ? demoWeddings[0] : null)
  );
}

export default function WeddingDashboardPage({
  params,
}: {
  params: { weddingId: string };
}) {
  const router = useRouter();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [form, setForm] = useState({
    title: '',
    brideName: '',
    groomName: '',
    city: '',
    startDate: '',
  });
  const [guests, setGuests] = useState<Guest[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        const [weddingData, guestData, budgetData, taskData] =
          await Promise.all([
            getJson(`/weddings/${params.weddingId}/dashboard`),
            getJson(`/weddings/${params.weddingId}/guests`),
            getJson(`/weddings/${params.weddingId}/budget`),
            getJson(`/weddings/${params.weddingId}/tasks`),
          ]);

        if (isActive) {
          const nextWedding = weddingData.wedding ?? weddingData;
          setWedding(nextWedding);
          setForm({
            title: nextWedding.title || '',
            brideName: nextWedding.brideName || '',
            groomName: nextWedding.groomName || '',
            city: nextWedding.city || '',
            startDate: nextWedding.startDate
              ? nextWedding.startDate.slice(0, 10)
              : '',
          });
          setGuests(Array.isArray(guestData) ? guestData : []);
          setBudgetItems(Array.isArray(budgetData) ? budgetData : []);
          setTasks(Array.isArray(taskData) ? taskData : []);
        }
      } catch (err) {
        if (isActive) {
          const demoWedding = getDemoWedding(params.weddingId);
          if (demoWedding) {
            setWedding(demoWedding);
            setForm({
              title: demoWedding.title,
              brideName: demoWedding.brideName || '',
              groomName: demoWedding.groomName || '',
              city: demoWedding.city || '',
              startDate: demoWedding.startDate
                ? demoWedding.startDate.slice(0, 10)
                : '',
            });
            setGuests([
              { status: 'CONFIRMED' },
              { status: 'CONFIRMED' },
              { status: 'PENDING' },
            ]);
            setBudgetItems([
              { amount: 750000, isPaid: true },
              { amount: 1250000, isPaid: false },
            ]);
            setTasks([
              { status: 'COMPLETED', isCompleted: true },
              { status: 'IN_PROGRESS', isCompleted: false },
              { status: 'OPEN', isCompleted: false },
            ]);
            setError('');
            return;
          }
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load wedding dashboard',
          );
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();
    return () => {
      isActive = false;
    };
  }, [params.weddingId]);

  const confirmedGuests = guests.filter(
    (guest) => guest.status === 'CONFIRMED',
  ).length;
  const guestResponse = guests.length
    ? Math.round((confirmedGuests / guests.length) * 100)
    : 0;
  const totalBudget = budgetItems.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );
  const paidBudget = budgetItems
    .filter((item) => item.isPaid)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const budgetCovered = totalBudget
    ? Math.round((paidBudget / totalBudget) * 100)
    : 0;
  const openTasks = tasks.filter(
    (task) => !task.isCompleted && task.status !== 'COMPLETED',
  ).length;

  async function handleSaveWedding(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const updated = await patchJson(`/weddings/${params.weddingId}`, {
        title: form.title.trim(),
        brideName: form.brideName.trim() || undefined,
        groomName: form.groomName.trim() || undefined,
        city: form.city.trim() || undefined,
        startDate: form.startDate || undefined,
      });
      setWedding(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save wedding');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleArchiveWedding() {
    setIsArchiving(true);
    setError('');

    try {
      await deleteJson(`/weddings/${params.weddingId}`);
      router.push('/customer/weddings');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not archive wedding',
      );
      setIsArchiving(false);
    }
  }

  return (
    <PlannerShell weddingId={params.weddingId}>
      <section className="space-y-6">
        <div className="rb-card relative overflow-hidden p-8 md:p-10">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[url('https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=80')] bg-cover bg-center opacity-20 lg:block" />
          <div className="relative">
            <p className="rb-kicker">Wedding dashboard</p>
            <h1 className="rb-heading mt-3 text-5xl sm:text-6xl">
              {wedding?.title || 'Your wedding planning hub'}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-[var(--rb-muted)]">
              {loading
                ? 'Loading planner details...'
                : `${formatDate(wedding?.startDate)}${wedding?.city ? ` in ${wedding.city}` : ''}`}
            </p>
            {error ? (
              <p className="mt-4 text-sm font-semibold text-[var(--rb-error)]">
                {error}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsEditing((current) => !current)}
                className="rb-button rb-button-secondary"
              >
                {isEditing ? 'Close edit' : 'Edit wedding'}
              </button>
              <button
                type="button"
                disabled={isArchiving}
                onClick={() => void handleArchiveWedding()}
                className="rb-button border border-[rgba(180,58,75,0.35)] bg-[rgba(180,58,75,0.08)] text-[var(--rb-error)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isArchiving ? 'Archiving...' : 'Archive wedding'}
              </button>
            </div>
          </div>
        </div>

        {isEditing ? (
          <form
            onSubmit={handleSaveWedding}
            className="rb-card-soft grid gap-4 p-6 md:grid-cols-2"
          >
            <input
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Wedding title"
              className="rounded-xl border border-[var(--rb-border)] bg-white px-3 py-2 md:col-span-2"
              required
            />
            <input
              value={form.brideName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  brideName: event.target.value,
                }))
              }
              placeholder="Bride name"
              className="rounded-xl border border-[var(--rb-border)] bg-white px-3 py-2"
            />
            <input
              value={form.groomName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  groomName: event.target.value,
                }))
              }
              placeholder="Groom name"
              className="rounded-xl border border-[var(--rb-border)] bg-white px-3 py-2"
            />
            <input
              value={form.city}
              onChange={(event) =>
                setForm((current) => ({ ...current, city: event.target.value }))
              }
              placeholder="City"
              className="rounded-xl border border-[var(--rb-border)] bg-white px-3 py-2"
            />
            <input
              value={form.startDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  startDate: event.target.value,
                }))
              }
              type="date"
              className="rounded-xl border border-[var(--rb-border)] bg-white px-3 py-2"
            />
            <button
              disabled={isSaving}
              className="rb-button rb-button-primary md:col-span-2 md:ml-auto disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? 'Saving...' : 'Save wedding'}
            </button>
          </form>
        ) : null}

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rb-card-soft p-6">
            <p className="text-sm font-bold text-[var(--rb-muted)]">
              Guest response
            </p>
            <p className="mt-2 text-3xl font-black text-[var(--rb-success)]">
              {guestResponse}%
            </p>
            <p className="mt-2 text-sm text-[var(--rb-muted)]">
              {confirmedGuests} of {guests.length} confirmed
            </p>
          </div>
          <div className="rb-card-soft p-6">
            <p className="text-sm font-bold text-[var(--rb-muted)]">
              Budget covered
            </p>
            <p className="mt-2 text-3xl font-black text-[var(--rb-warning)]">
              {budgetCovered}%
            </p>
            <p className="mt-2 text-sm text-[var(--rb-muted)]">
              PKR {paidBudget.toLocaleString()} paid
            </p>
          </div>
          <div className="rb-card-soft p-6">
            <p className="text-sm font-bold text-[var(--rb-muted)]">
              Tasks left
            </p>
            <p className="mt-2 text-3xl font-black text-[var(--rb-burgundy)]">
              {openTasks}
            </p>
            <p className="mt-2 text-sm text-[var(--rb-muted)]">
              {tasks.length} total tasks
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {modules.map((module) => (
            <Link
              key={module.title}
              href={`/customer/weddings/${params.weddingId}/${module.href}`}
              className="rb-card p-6 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <h2 className="text-2xl font-bold text-[var(--rb-burgundy-dark)] rb-serif">
                {module.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--rb-muted)]">
                {module.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </PlannerShell>
  );
}
