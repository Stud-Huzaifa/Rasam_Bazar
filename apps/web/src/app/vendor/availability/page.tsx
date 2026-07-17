'use client';

import { useEffect, useState } from 'react';
import { VendorShell } from '../../components/vendor-shell';
import { deleteJson, getJson, postJson } from '../../lib/api';

const statuses = [
  'AVAILABLE',
  'TENTATIVELY_RESERVED',
  'BOOKED',
  'UNAVAILABLE',
  'PARTIALLY_AVAILABLE',
];

export default function VendorAvailabilityPage() {
  const [vendor, setVendor] = useState<any>(null);
  const [teamForm, setTeamForm] = useState({
    name: '',
    description: '',
    capacity: '1',
  });
  const [slotForm, setSlotForm] = useState({
    teamId: '',
    date: '',
    startTime: '',
    endTime: '',
    capacity: '1',
    status: 'AVAILABLE',
    notes: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadVendor() {
    try {
      const data = await getJson('/vendors/me');
      setVendor(data);
      if (!slotForm.teamId && data.teams?.[0]?.id) {
        setSlotForm((current) => ({ ...current, teamId: data.teams[0].id }));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load availability',
      );
    }
  }

  useEffect(() => {
    void loadVendor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addTeam(event: React.FormEvent) {
    event.preventDefault();
    if (!vendor?.id || !teamForm.name.trim()) {
      setError('Team name is required.');
      return;
    }
    try {
      setError('');
      setSuccess('');
      await postJson(`/vendors/${vendor.id}/teams`, teamForm);
      setTeamForm({ name: '', description: '', capacity: '1' });
      setSuccess('Team added.');
      await loadVendor();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add team');
    }
  }

  async function addSlot(event: React.FormEvent) {
    event.preventDefault();
    if (!vendor?.id || !slotForm.date) {
      setError('Date is required for calendar slots.');
      return;
    }
    try {
      setError('');
      setSuccess('');
      await postJson(`/vendors/${vendor.id}/availability`, slotForm);
      setSlotForm((current) => ({
        ...current,
        date: '',
        startTime: '',
        endTime: '',
        notes: '',
      }));
      setSuccess('Calendar slot added.');
      await loadVendor();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add slot');
    }
  }

  async function removeSlot(id: string) {
    try {
      setError('');
      setSuccess('');
      await deleteJson(`/availability/${id}`);
      setSuccess('Calendar slot removed.');
      await loadVendor();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove slot');
    }
  }

  return (
    <VendorShell>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-400">
          Availability
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          Manage teams and calendar capacity
        </h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          Track whether each team is available, tentatively reserved, booked,
          unavailable, or partially available.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <form
            onSubmit={addTeam}
            className="rounded-2xl border border-white/10 bg-slate-900/70 p-5"
          >
            <h2 className="text-xl font-semibold">Add team</h2>
            <div className="mt-4 grid gap-4">
              <input
                value={teamForm.name}
                onChange={(event) =>
                  setTeamForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Team name"
                aria-label="Team name"
                required
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
              />
              <input
                value={teamForm.capacity}
                onChange={(event) =>
                  setTeamForm((current) => ({
                    ...current,
                    capacity: event.target.value,
                  }))
                }
                placeholder="Capacity"
                type="number"
                min="1"
                aria-label="Team capacity"
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
              />
              <textarea
                value={teamForm.description}
                onChange={(event) =>
                  setTeamForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Description"
                aria-label="Team description"
                className="min-h-20 rounded-lg border border-white/10 bg-white/10 px-3 py-2"
              />
              <button
                type="submit"
                className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-slate-950"
              >
                Add team
              </button>
            </div>
          </form>

          <form
            onSubmit={addSlot}
            className="rounded-2xl border border-white/10 bg-slate-900/70 p-5"
          >
            <h2 className="text-xl font-semibold">Add calendar slot</h2>
            <div className="mt-4 grid gap-4">
              <select
                value={slotForm.teamId}
                onChange={(event) =>
                  setSlotForm((current) => ({
                    ...current,
                    teamId: event.target.value,
                  }))
                }
                aria-label="Team"
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
              >
                <option value="">No team</option>
                {(vendor?.teams || []).map((team: any) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <input
                value={slotForm.date}
                onChange={(event) =>
                  setSlotForm((current) => ({
                    ...current,
                    date: event.target.value,
                  }))
                }
                type="date"
                aria-label="Slot date"
                required
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={slotForm.startTime}
                  onChange={(event) =>
                    setSlotForm((current) => ({
                      ...current,
                      startTime: event.target.value,
                    }))
                  }
                  type="time"
                  aria-label="Start time"
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
                />
                <input
                  value={slotForm.endTime}
                  onChange={(event) =>
                    setSlotForm((current) => ({
                      ...current,
                      endTime: event.target.value,
                    }))
                  }
                  type="time"
                  aria-label="End time"
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
                />
              </div>
              <select
                value={slotForm.status}
                onChange={(event) =>
                  setSlotForm((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
                aria-label="Availability status"
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
              <textarea
                value={slotForm.notes}
                onChange={(event) =>
                  setSlotForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                placeholder="Notes"
                aria-label="Availability notes"
                className="min-h-20 rounded-lg border border-white/10 bg-white/10 px-3 py-2"
              />
              <button
                type="submit"
                className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-slate-950"
              >
                Add slot
              </button>
            </div>
          </form>
        </div>

        {error ? (
          <p role="alert" className="mt-4 rb-alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p role="status" aria-live="polite" className="mt-4 rb-success">
            {success}
          </p>
        ) : null}

        <div className="mt-8 space-y-4">
          {(vendor?.availability || []).map((slot: any) => (
            <div
              key={slot.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <h2 className="font-semibold">
                  {slot.team?.name || 'General availability'}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {new Date(slot.date).toLocaleDateString()}{' '}
                  {slot.startTime
                    ? `${slot.startTime}-${slot.endTime || ''}`
                    : ''}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-sky-500/15 px-3 py-1 text-sm text-sky-300">
                  {slot.status.replaceAll('_', ' ')}
                </span>
                <button
                  type="button"
                  onClick={() => void removeSlot(slot.id)}
                  className="rounded-lg border border-rose-400/30 px-3 py-1 text-sm text-rose-300 hover:bg-rose-500/10"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        {!vendor?.availability?.length ? (
          <p className="mt-8 rb-empty">
            No availability slots yet. Add a calendar slot to publish capacity.
          </p>
        ) : null}
      </section>
    </VendorShell>
  );
}
