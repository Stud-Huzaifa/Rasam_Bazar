'use client';

import { useEffect, useState } from 'react';
import { VendorShell } from '../../components/vendor-shell';
import { getJson, postJson } from '../../lib/api';

export default function VendorProposalsPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [form, setForm] = useState({
    totalPrice: '',
    packageDescription: '',
    inclusions: '',
    exclusions: '',
    addOns: '',
    teamSize: '',
    setupTime: '',
    deliveryTime: '',
    advanceAmount: '',
    paymentSchedule: '',
    cancellationPolicy: '',
    validityDate: '',
    terms: '',
    changeSummary: '',
    submit: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadData() {
    try {
      const [matchData, proposalData] = await Promise.all([
        getJson('/vendors/me/matching-requests'),
        getJson('/vendors/me/proposals'),
      ]);
      setMatches(Array.isArray(matchData) ? matchData : []);
      setProposals(Array.isArray(proposalData) ? proposalData : []);
      if (
        !selectedRequestId &&
        Array.isArray(matchData) &&
        matchData[0]?.request?.id
      ) {
        setSelectedRequestId(matchData[0].request.id);
      }
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load proposals');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitProposal(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedRequestId || !form.totalPrice) return;
    try {
      await postJson(`/service-requests/${selectedRequestId}/proposals`, form);
      setForm({
        totalPrice: '',
        packageDescription: '',
        inclusions: '',
        exclusions: '',
        addOns: '',
        teamSize: '',
        setupTime: '',
        deliveryTime: '',
        advanceAmount: '',
        paymentSchedule: '',
        cancellationPolicy: '',
        validityDate: '',
        terms: '',
        changeSummary: '',
        submit: true,
      });
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not submit proposal',
      );
    }
  }

  async function reviseProposal(proposalId: string) {
    if (!form.totalPrice) return;
    await postJson(`/proposals/${proposalId}/revisions`, form);
    await loadData();
  }

  async function withdrawProposal(proposalId: string) {
    await postJson(`/proposals/${proposalId}/withdraw`, {});
    await loadData();
  }

  return (
    <VendorShell>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-400">
          Proposals
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          Submit quotations and revisions
        </h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          Create a structured proposal for a matching request. Revisions create
          new versions instead of overwriting old terms.
        </p>

        {loading ? (
          <p className="mt-6 text-sm text-slate-400">Loading proposals...</p>
        ) : null}
        {error ? <p className="mt-6 text-sm text-rose-300">{error}</p> : null}

        <form
          onSubmit={submitProposal}
          className="mt-8 grid gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-5 md:grid-cols-2"
        >
          <select
            value={selectedRequestId}
            onChange={(event) => setSelectedRequestId(event.target.value)}
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 md:col-span-2"
          >
            {matches.map((item) => (
              <option key={item.request.id} value={item.request.id}>
                {item.request.title} - {item.match.score}% match
              </option>
            ))}
          </select>
          <input
            value={form.totalPrice}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                totalPrice: event.target.value,
              }))
            }
            placeholder="Total price"
            type="number"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <input
            value={form.advanceAmount}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                advanceAmount: event.target.value,
              }))
            }
            placeholder="Advance amount"
            type="number"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <input
            value={form.teamSize}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                teamSize: event.target.value,
              }))
            }
            placeholder="Team size"
            type="number"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <input
            value={form.validityDate}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                validityDate: event.target.value,
              }))
            }
            type="date"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <input
            value={form.setupTime}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                setupTime: event.target.value,
              }))
            }
            placeholder="Setup time"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <input
            value={form.deliveryTime}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                deliveryTime: event.target.value,
              }))
            }
            placeholder="Delivery time"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <textarea
            value={form.packageDescription}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                packageDescription: event.target.value,
              }))
            }
            placeholder="Package description"
            className="min-h-20 rounded-lg border border-white/10 bg-white/10 px-3 py-2 md:col-span-2"
          />
          <input
            value={form.inclusions}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                inclusions: event.target.value,
              }))
            }
            placeholder="Inclusions"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <input
            value={form.exclusions}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                exclusions: event.target.value,
              }))
            }
            placeholder="Exclusions"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <input
            value={form.addOns}
            onChange={(event) =>
              setForm((current) => ({ ...current, addOns: event.target.value }))
            }
            placeholder="Add-ons"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <input
            value={form.paymentSchedule}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                paymentSchedule: event.target.value,
              }))
            }
            placeholder="Payment schedule"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <textarea
            value={form.cancellationPolicy}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                cancellationPolicy: event.target.value,
              }))
            }
            placeholder="Cancellation policy"
            className="min-h-20 rounded-lg border border-white/10 bg-white/10 px-3 py-2 md:col-span-2"
          />
          <textarea
            value={form.terms}
            onChange={(event) =>
              setForm((current) => ({ ...current, terms: event.target.value }))
            }
            placeholder="Terms"
            className="min-h-20 rounded-lg border border-white/10 bg-white/10 px-3 py-2 md:col-span-2"
          />
          <button
            disabled={!selectedRequestId}
            className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-slate-950 md:col-span-2 md:ml-auto disabled:cursor-not-allowed disabled:opacity-70"
          >
            Submit proposal
          </button>
        </form>

        <div className="mt-8 space-y-4">
          {proposals.map((proposal) => {
            const latest = proposal.versions?.[0];
            return (
              <div
                key={proposal.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm text-amber-300">
                      {proposal.serviceRequest?.title}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">
                      PKR {Number(latest?.totalPrice || 0).toLocaleString()}
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Version {latest?.versionNumber || 0} - {proposal.status}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => void reviseProposal(proposal.id)}
                      className="rounded-lg border border-amber-400/40 px-3 py-1 text-sm text-amber-300 hover:bg-amber-400/10"
                    >
                      Revise with form
                    </button>
                    <button
                      onClick={() => void withdrawProposal(proposal.id)}
                      className="rounded-lg border border-rose-400/30 px-3 py-1 text-sm text-rose-300 hover:bg-rose-500/10"
                    >
                      Withdraw
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </VendorShell>
  );
}
