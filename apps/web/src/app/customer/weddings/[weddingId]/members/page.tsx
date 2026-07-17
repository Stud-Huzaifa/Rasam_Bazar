'use client';

import { useEffect, useState } from 'react';
import { deleteJson, getJson, patchJson, postJson } from '../../../../lib/api';
import { PlannerShell } from '../../../../components/planner-shell';

type Member = {
  id: string;
  email: string;
  fullName?: string | null;
  role: string;
  status: string;
};

const roles = [
  'WEDDING_OWNER',
  'BUDGET_MANAGER',
  'VENDOR_COORDINATOR',
  'GUEST_MANAGER',
  'CATERING_COORDINATOR',
  'SHOPPING_COORDINATOR',
  'TRANSPORT_COORDINATOR',
  'EVENT_DAY_COORDINATOR',
  'VIEWER',
];

function label(value: string) {
  return value.replaceAll('_', ' ').toLowerCase();
}

export default function MembersPage({
  params,
}: {
  params: { weddingId: string };
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [form, setForm] = useState({ email: '', fullName: '', role: 'VIEWER' });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    async function loadMembers() {
      try {
        setLoading(true);
        const data = await getJson(`/weddings/${params.weddingId}/members`);
        if (isActive) {
          setMembers(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isActive) {
          setError(
            err instanceof Error ? err.message : 'Could not load members',
          );
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadMembers();
    return () => {
      isActive = false;
    };
  }, [params.weddingId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.email.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const created = await postJson(`/weddings/${params.weddingId}/members`, {
        email: form.email.trim(),
        fullName: form.fullName.trim() || undefined,
        role: form.role,
      });
      setMembers((current) => [
        ...current.filter((member) => member.id !== created.id),
        created,
      ]);
      setForm({ email: '', fullName: '', role: 'VIEWER' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add member');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRoleChange(member: Member, role: string) {
    setBusyId(member.id);
    setError('');

    try {
      const updated = await patchJson(
        `/weddings/${params.weddingId}/members/${member.id}`,
        { role },
      );
      setMembers((current) =>
        current.map((item) => (item.id === member.id ? updated : item)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update member');
    } finally {
      setBusyId('');
    }
  }

  async function handleRemove(member: Member) {
    setBusyId(member.id);
    setError('');

    try {
      await deleteJson(`/weddings/${params.weddingId}/members/${member.id}`);
      setMembers((current) => current.filter((item) => item.id !== member.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove member');
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
              Family coordination
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              Assign planning responsibilities
            </h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Invite family members and give each person a clear planning role.
            </p>
          </div>
          <div className="rounded-full border border-amber-400/40 px-4 py-2 text-sm text-amber-300">
            {members.length} members
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 grid gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-5 md:grid-cols-2"
        >
          <input
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
            placeholder="Email"
            type="email"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <input
            value={form.fullName}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                fullName: event.target.value,
              }))
            }
            placeholder="Full name"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <select
            value={form.role}
            onChange={(event) =>
              setForm((current) => ({ ...current, role: event.target.value }))
            }
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 md:col-span-2"
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {label(role)}
              </option>
            ))}
          </select>
          <button
            disabled={isSubmitting}
            className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-slate-950 md:col-span-2 md:ml-auto disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Saving...' : 'Add member'}
          </button>
        </form>

        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
        {loading ? (
          <p className="mt-6 text-sm text-slate-400">Loading members...</p>
        ) : null}

        <div className="mt-8 space-y-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <h2 className="text-lg font-semibold">
                  {member.fullName || member.email}
                </h2>
                <p className="text-sm text-slate-400">{member.email}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-amber-300">
                  {member.status}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={member.role}
                  disabled={busyId === member.id}
                  onChange={(event) =>
                    void handleRoleChange(member, event.target.value)
                  }
                  className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm capitalize disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {label(role)}
                    </option>
                  ))}
                </select>
                <button
                  disabled={busyId === member.id}
                  type="button"
                  onClick={() => void handleRemove(member)}
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
