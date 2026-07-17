'use client';

import { useEffect, useState } from 'react';
import { deleteJson, getJson, patchJson, postJson } from '../../../../lib/api';
import { PlannerShell } from '../../../../components/planner-shell';

type BudgetItem = {
  id?: string;
  title: string;
  category?: string | null;
  amount: number;
  paid?: boolean;
  isPaid?: boolean;
};

export default function BudgetPage({
  params,
}: {
  params: { weddingId: string };
}) {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [form, setForm] = useState({
    title: '',
    category: '',
    amount: '',
    paid: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const total = budgetItems.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );
  const paidTotal = budgetItems
    .filter((item) => Boolean(item.isPaid ?? item.paid))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  useEffect(() => {
    let isActive = true;

    async function loadBudget() {
      try {
        setLoading(true);
        const data = await getJson(`/weddings/${params.weddingId}/budget`);
        if (isActive) {
          setBudgetItems(
            Array.isArray(data)
              ? data.map((item: any) => ({
                  id: item.id,
                  title: item.title,
                  category: item.category ?? 'Other',
                  amount: Number(item.amount || 0),
                  paid: Boolean(item.isPaid),
                  isPaid: Boolean(item.isPaid),
                }))
              : [],
          );
        }
      } catch (err) {
        if (isActive) {
          setError(
            err instanceof Error ? err.message : 'Could not load budget',
          );
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadBudget();
    return () => {
      isActive = false;
    };
  }, [params.weddingId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || !form.amount) return;

    setIsSubmitting(true);
    setError('');

    try {
      const created = await postJson(`/weddings/${params.weddingId}/budget`, {
        title: form.title.trim(),
        category: form.category.trim() || 'Other',
        amount: Number(form.amount),
        isPaid: form.paid,
      });

      setBudgetItems((current) => [
        ...current,
        {
          id: created.id,
          title: created.title ?? form.title.trim(),
          category: (created.category ?? form.category.trim()) || 'Other',
          amount: Number(created.amount || form.amount),
          paid: Boolean(created.isPaid ?? form.paid),
          isPaid: Boolean(created.isPaid ?? form.paid),
        },
      ]);
      setForm({ title: '', category: '', amount: '', paid: false });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not add budget item',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePaidChange(item: BudgetItem, isPaid: boolean) {
    if (!item.id) return;

    setBusyId(item.id);
    setError('');

    try {
      const updated = await patchJson(
        `/weddings/${params.weddingId}/budget/${item.id}`,
        { isPaid },
      );
      setBudgetItems((current) =>
        current.map((budgetItem) =>
          budgetItem.id === item.id
            ? {
                ...budgetItem,
                paid: Boolean(updated.isPaid),
                isPaid: Boolean(updated.isPaid),
              }
            : budgetItem,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not update budget item',
      );
    } finally {
      setBusyId('');
    }
  }

  async function handleDelete(item: BudgetItem) {
    if (!item.id) return;

    setBusyId(item.id);
    setError('');

    try {
      await deleteJson(`/weddings/${params.weddingId}/budget/${item.id}`);
      setBudgetItems((current) =>
        current.filter((budgetItem) => budgetItem.id !== item.id),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not remove budget item',
      );
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
              Budget planner
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              Track wedding expenses
            </h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Keep your celebrations financially organized with a simple
              budgeting view for each wedding.
            </p>
          </div>
          <div className="rounded-full border border-amber-400/40 px-4 py-2 text-sm text-amber-300">
            PKR {paidTotal.toLocaleString()} paid
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 grid gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-5 md:grid-cols-2"
        >
          <input
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="Item title"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <input
            value={form.category}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                category: event.target.value,
              }))
            }
            placeholder="Category"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <input
            value={form.amount}
            onChange={(event) =>
              setForm((current) => ({ ...current, amount: event.target.value }))
            }
            placeholder="Amount"
            type="number"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.paid}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  paid: event.target.checked,
                }))
              }
            />
            Mark as paid
          </label>
          <button
            disabled={isSubmitting}
            type="submit"
            className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-slate-950 md:col-span-2 md:ml-auto disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Saving...' : 'Add budget item'}
          </button>
        </form>

        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
        {loading ? (
          <p className="mt-6 text-sm text-slate-400">Loading budget...</p>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
            <p className="text-sm text-slate-400">Estimated total</p>
            <p className="mt-2 text-2xl font-semibold">
              PKR {total.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5">
            <p className="text-sm text-emerald-300">Paid</p>
            <p className="mt-2 text-2xl font-semibold">
              PKR {paidTotal.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-5">
            <p className="text-sm text-amber-300">Remaining</p>
            <p className="mt-2 text-2xl font-semibold">
              PKR {(total - paidTotal).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {budgetItems.map((item) => (
            <div
              key={item.id ?? `${item.title}-${item.category}`}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <h2 className="text-lg font-semibold">{item.title}</h2>
                <p className="text-sm text-slate-400">{item.category}</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-sm text-slate-300">
                  PKR {Number(item.amount || 0).toLocaleString()}
                </span>
                <label
                  className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm ${Boolean(item.isPaid ?? item.paid) ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(item.isPaid ?? item.paid)}
                    disabled={busyId === item.id}
                    onChange={(event) =>
                      void handlePaidChange(item, event.target.checked)
                    }
                  />
                  {Boolean(item.isPaid ?? item.paid) ? 'Paid' : 'Pending'}
                </label>
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
          ))}
        </div>
      </div>
    </PlannerShell>
  );
}
