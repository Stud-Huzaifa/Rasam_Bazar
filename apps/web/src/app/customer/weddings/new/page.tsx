'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { postJson } from '../../../lib/api';

export default function NewWeddingPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    brideName: '',
    groomName: '',
    city: '',
    estimatedBudget: '',
    estimatedGuestCount: '',
    startDate: '',
    endDate: '',
    mainCoordinator: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const created = await postJson('/weddings', {
        title: form.title.trim(),
        brideName: form.brideName.trim() || undefined,
        groomName: form.groomName.trim() || undefined,
        city: form.city.trim() || undefined,
        estimatedBudget: form.estimatedBudget
          ? Number(form.estimatedBudget)
          : undefined,
        estimatedGuestCount: form.estimatedGuestCount
          ? Number(form.estimatedGuestCount)
          : undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        mainCoordinator: form.mainCoordinator.trim() || undefined,
        notes: form.notes.trim() || undefined,
        status: 'PLANNING',
      });

      router.push(`/customer/weddings/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create wedding');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      id="main-content"
      className="min-h-screen bg-slate-950 px-6 py-16 text-white"
    >
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10"
      >
        <p className="text-sm uppercase tracking-[0.3em] text-amber-400">
          New wedding
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Start a wedding profile</h1>
        <p className="mt-4 text-slate-300">
          Capture the core details, then build the plan with guests, budget
          items, and tasks.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-300 md:col-span-2">
            Wedding title
            <input
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
              placeholder="Aisha and Hammad Wedding"
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-300">
            Bride name
            <input
              value={form.brideName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  brideName: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
            />
          </label>
          <label className="block text-sm font-medium text-slate-300">
            Groom name
            <input
              value={form.groomName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  groomName: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
            />
          </label>
          <label className="block text-sm font-medium text-slate-300">
            City
            <input
              value={form.city}
              onChange={(event) =>
                setForm((current) => ({ ...current, city: event.target.value }))
              }
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
            />
          </label>
          <label className="block text-sm font-medium text-slate-300">
            Estimated budget
            <input
              value={form.estimatedBudget}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  estimatedBudget: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
              type="number"
              min="0"
            />
          </label>
          <label className="block text-sm font-medium text-slate-300">
            Estimated guest count
            <input
              value={form.estimatedGuestCount}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  estimatedGuestCount: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
              type="number"
              min="0"
            />
          </label>
          <label className="block text-sm font-medium text-slate-300">
            Main coordinator
            <input
              value={form.mainCoordinator}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  mainCoordinator: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
            />
          </label>
          <label className="block text-sm font-medium text-slate-300">
            Start date
            <input
              value={form.startDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  startDate: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
              type="date"
            />
          </label>
          <label className="block text-sm font-medium text-slate-300">
            End date
            <input
              value={form.endDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  endDate: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
              type="date"
            />
          </label>
          <label className="block text-sm font-medium text-slate-300 md:col-span-2">
            Notes
            <textarea
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              className="mt-2 min-h-28 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
            />
          </label>
        </div>

        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

        <button
          disabled={isSubmitting}
          className="mt-8 rounded-lg bg-amber-500 px-5 py-3 font-medium text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Creating...' : 'Create wedding'}
        </button>
      </form>
    </main>
  );
}
