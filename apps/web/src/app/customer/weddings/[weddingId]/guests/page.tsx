'use client';

import { useEffect, useState } from 'react';
import { deleteJson, getJson, patchJson, postJson } from '../../../../lib/api';
import { PlannerShell } from '../../../../components/planner-shell';

type GuestStatus = 'Confirmed' | 'Pending' | 'Invited';

type GuestItem = {
  id?: string;
  name: string;
  relation?: string | null;
  phone?: string | null;
  status: GuestStatus;
};

function normalizeGuestStatus(status?: string): GuestStatus {
  switch (status?.toUpperCase()) {
    case 'CONFIRMED':
      return 'Confirmed';
    case 'INVITED':
      return 'Invited';
    default:
      return 'Pending';
  }
}

function serializeGuestStatus(status: GuestStatus) {
  return status.toUpperCase();
}

export default function GuestsPage({
  params,
}: {
  params: { weddingId: string };
}) {
  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [form, setForm] = useState({
    name: '',
    relation: '',
    phone: '',
    status: 'Pending' as GuestStatus,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    async function loadGuests() {
      try {
        setLoading(true);
        const data = await getJson(`/weddings/${params.weddingId}/guests`);
        if (isActive) {
          setGuests(
            Array.isArray(data)
              ? data.map((item: any) => ({
                  id: item.id,
                  name: item.name,
                  relation: item.relation ?? '',
                  phone: item.phone ?? '',
                  status: normalizeGuestStatus(item.status),
                }))
              : [],
          );
        }
      } catch (err) {
        if (isActive) {
          setError(
            err instanceof Error ? err.message : 'Could not load guests',
          );
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadGuests();
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
      const created = await postJson(`/weddings/${params.weddingId}/guests`, {
        name: form.name.trim(),
        relation: form.relation.trim(),
        phone: form.phone.trim(),
        status: serializeGuestStatus(form.status),
      });

      setGuests((current) => [
        ...current,
        {
          id: created.id,
          name: created.name ?? form.name.trim(),
          relation: created.relation ?? form.relation.trim(),
          phone: created.phone ?? form.phone.trim(),
          status: normalizeGuestStatus(created.status),
        },
      ]);
      setForm({ name: '', relation: '', phone: '', status: 'Pending' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add guest');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusChange(guest: GuestItem, status: GuestStatus) {
    if (!guest.id) return;

    setBusyId(guest.id);
    setError('');

    try {
      const updated = await patchJson(
        `/weddings/${params.weddingId}/guests/${guest.id}`,
        {
          status: serializeGuestStatus(status),
        },
      );

      setGuests((current) =>
        current.map((item) =>
          item.id === guest.id
            ? { ...item, status: normalizeGuestStatus(updated.status) }
            : item,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update guest');
    } finally {
      setBusyId('');
    }
  }

  async function handleDelete(guest: GuestItem) {
    if (!guest.id) return;

    setBusyId(guest.id);
    setError('');

    try {
      await deleteJson(`/weddings/${params.weddingId}/guests/${guest.id}`);
      setGuests((current) => current.filter((item) => item.id !== guest.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove guest');
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
              Guest coordination
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              Keep your guest list organized
            </h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Track invitations, RSVPs, and family contacts in a single planning
              view.
            </p>
          </div>
          <div className="rounded-full border border-amber-400/40 px-4 py-2 text-sm text-amber-300">
            {guests.length} guest entries
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
            placeholder="Guest name"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <input
            value={form.relation}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                relation: event.target.value,
              }))
            }
            placeholder="Relation"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <input
            value={form.phone}
            onChange={(event) =>
              setForm((current) => ({ ...current, phone: event.target.value }))
            }
            placeholder="Phone"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <select
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                status: event.target.value as GuestStatus,
              }))
            }
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          >
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Invited">Invited</option>
          </select>
          <button
            disabled={isSubmitting}
            type="submit"
            className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-slate-950 md:col-span-2 md:ml-auto disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Saving...' : 'Add guest'}
          </button>
        </form>

        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
        {loading ? (
          <p className="mt-6 text-sm text-slate-400">Loading guests...</p>
        ) : null}

        <div className="mt-8 space-y-4">
          {guests.map((guest) => (
            <div
              key={guest.id ?? `${guest.name}-${guest.relation}`}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <h2 className="text-lg font-semibold">{guest.name}</h2>
                <p className="text-sm text-slate-400">{guest.relation}</p>
                {guest.phone ? (
                  <p className="mt-1 text-sm text-slate-500">{guest.phone}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={guest.status}
                  disabled={busyId === guest.id}
                  onChange={(event) =>
                    void handleStatusChange(
                      guest,
                      event.target.value as GuestStatus,
                    )
                  }
                  className={`rounded-full border border-white/10 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-70 ${guest.status === 'Confirmed' ? 'bg-emerald-500/15 text-emerald-300' : guest.status === 'Pending' ? 'bg-amber-500/15 text-amber-300' : 'bg-sky-500/15 text-sky-300'}`}
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Invited">Invited</option>
                </select>
                <button
                  disabled={busyId === guest.id}
                  type="button"
                  onClick={() => void handleDelete(guest)}
                  className="rounded-lg border border-rose-400/30 px-3 py-1 text-sm text-rose-300 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PlannerShell>
  );
}
