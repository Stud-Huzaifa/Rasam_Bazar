'use client';

import { useEffect, useState } from 'react';
import { deleteJson, getJson, patchJson, postJson } from '../../../../lib/api';
import { PlannerShell } from '../../../../components/planner-shell';

type WeddingEvent = {
  id: string;
  name: string;
  eventType: string;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  venue?: string | null;
  city?: string | null;
  guestCount?: number | null;
  eventBudget?: number | string | null;
  assignedCoordinator?: string | null;
};

const eventTypes = [
  'Engagement',
  'Dholki',
  'Mayun',
  'Mehndi',
  'Nikah',
  'Baraat',
  'Rukhsati',
  'Walima',
  'Reception',
  'Custom',
];

export default function EventsPage({
  params,
}: {
  params: { weddingId: string };
}) {
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [form, setForm] = useState({
    name: '',
    eventType: 'Mehndi',
    date: '',
    startTime: '',
    endTime: '',
    venue: '',
    city: '',
    guestCount: '',
    eventBudget: '',
    assignedCoordinator: '',
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [editingId, setEditingId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    async function loadEvents() {
      try {
        setLoading(true);
        const data = await getJson(`/weddings/${params.weddingId}/events`);
        if (isActive) {
          setEvents(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isActive) {
          setError(
            err instanceof Error ? err.message : 'Could not load events',
          );
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadEvents();
    return () => {
      isActive = false;
    };
  }, [params.weddingId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        name: form.name.trim(),
        eventType: form.eventType,
        date: form.date || undefined,
        startTime: form.startTime || undefined,
        endTime: form.endTime || undefined,
        venue: form.venue.trim() || undefined,
        city: form.city.trim() || undefined,
        guestCount: form.guestCount ? Number(form.guestCount) : undefined,
        eventBudget: form.eventBudget ? Number(form.eventBudget) : undefined,
        assignedCoordinator: form.assignedCoordinator.trim() || undefined,
      };
      const saved = editingId
        ? await patchJson(`/events/${editingId}`, payload)
        : await postJson(`/weddings/${params.weddingId}/events`, payload);
      setEvents((current) =>
        editingId
          ? current.map((item) => (item.id === editingId ? saved : item))
          : [...current, saved],
      );
      setForm({
        name: '',
        eventType: 'Mehndi',
        date: '',
        startTime: '',
        endTime: '',
        venue: '',
        city: '',
        guestCount: '',
        eventBudget: '',
        assignedCoordinator: '',
      });
      setEditingId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save event');
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEdit(item: WeddingEvent) {
    setEditingId(item.id);
    setForm({
      name: item.name || '',
      eventType: item.eventType || 'Custom',
      date: item.date ? item.date.slice(0, 10) : '',
      startTime: item.startTime || '',
      endTime: item.endTime || '',
      venue: item.venue || '',
      city: item.city || '',
      guestCount: item.guestCount ? String(item.guestCount) : '',
      eventBudget: item.eventBudget ? String(item.eventBudget) : '',
      assignedCoordinator: item.assignedCoordinator || '',
    });
  }

  async function handleDelete(item: WeddingEvent) {
    setBusyId(item.id);
    setError('');

    try {
      await deleteJson(`/events/${item.id}`);
      setEvents((current) => current.filter((entry) => entry.id !== item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove event');
    } finally {
      setBusyId('');
    }
  }

  return (
    <PlannerShell weddingId={params.weddingId}>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-400">
              Wedding events
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              Build the complete event schedule
            </h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Track each desi wedding event with venue, timing, guest count,
              budget, and coordinator ownership.
            </p>
          </div>
          <div className="rounded-full border border-amber-400/40 px-4 py-2 text-sm text-amber-300">
            {events.length} events
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 grid gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-5 md:grid-cols-2"
        >
          <input
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Event name"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <select
            value={form.eventType}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                eventType: event.target.value,
              }))
            }
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          >
            {eventTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <input
            value={form.date}
            onChange={(event) =>
              setForm((current) => ({ ...current, date: event.target.value }))
            }
            type="date"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.startTime}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  startTime: event.target.value,
                }))
              }
              type="time"
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
            />
            <input
              value={form.endTime}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  endTime: event.target.value,
                }))
              }
              type="time"
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
            />
          </div>
          <input
            value={form.venue}
            onChange={(event) =>
              setForm((current) => ({ ...current, venue: event.target.value }))
            }
            placeholder="Venue"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <input
            value={form.city}
            onChange={(event) =>
              setForm((current) => ({ ...current, city: event.target.value }))
            }
            placeholder="City"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <input
            value={form.guestCount}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                guestCount: event.target.value,
              }))
            }
            placeholder="Guest count"
            type="number"
            min="0"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <input
            value={form.eventBudget}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                eventBudget: event.target.value,
              }))
            }
            placeholder="Event budget"
            type="number"
            min="0"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <input
            value={form.assignedCoordinator}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                assignedCoordinator: event.target.value,
              }))
            }
            placeholder="Assigned coordinator"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 md:col-span-2"
          />
          <button
            disabled={isSubmitting}
            className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-slate-950 md:col-span-2 md:ml-auto disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting
              ? 'Saving...'
              : editingId
                ? 'Save event'
                : 'Add event'}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={() => {
                setEditingId('');
                setForm({
                  name: '',
                  eventType: 'Mehndi',
                  date: '',
                  startTime: '',
                  endTime: '',
                  venue: '',
                  city: '',
                  guestCount: '',
                  eventBudget: '',
                  assignedCoordinator: '',
                });
              }}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200 md:col-span-2 md:ml-auto"
            >
              Cancel edit
            </button>
          ) : null}
        </form>

        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
        {loading ? (
          <p className="mt-6 text-sm text-slate-400">Loading events...</p>
        ) : null}

        <div className="mt-8 space-y-4">
          {events.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm text-amber-300">{item.eventType}</p>
                  <h2 className="mt-1 text-xl font-semibold">{item.name}</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    {item.date
                      ? new Date(item.date).toLocaleDateString()
                      : 'Date not set'}{' '}
                    {item.startTime ? `at ${item.startTime}` : ''}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {item.venue || 'Venue not set'}
                    {item.city ? ` - ${item.city}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-sky-500/15 px-3 py-1 text-sm text-sky-300">
                    {item.guestCount ?? 0} guests
                  </span>
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm text-emerald-300">
                    PKR {Number(item.eventBudget || 0).toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="rounded-lg border border-sky-400/30 px-3 py-1 text-sm text-sky-300 transition hover:bg-sky-500/10"
                  >
                    Edit
                  </button>
                  <button
                    disabled={busyId === item.id}
                    type="button"
                    onClick={() => void handleDelete(item)}
                    className="rounded-lg border border-rose-400/30 px-3 py-1 text-sm text-rose-300 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Remove
                  </button>
                </div>
              </div>
              {item.assignedCoordinator ? (
                <p className="mt-4 text-sm text-slate-400">
                  Coordinator: {item.assignedCoordinator}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </PlannerShell>
  );
}
