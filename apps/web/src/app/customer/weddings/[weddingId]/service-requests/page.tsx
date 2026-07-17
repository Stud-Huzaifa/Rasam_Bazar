'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getJson, postJson } from '../../../../lib/api';
import { PlannerShell } from '../../../../components/planner-shell';

const visibilityOptions = [
  'PUBLIC_TO_MATCHING_VENDORS',
  'INVITE_ONLY',
  'PRIVATE',
];

export default function ServiceRequestsPage({
  params,
}: {
  params: { weddingId: string };
}) {
  const [requests, setRequests] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: '',
    categorySlug: 'catering',
    city: '',
    venue: '',
    eventDate: '',
    startTime: '',
    guestCount: '',
    minBudget: '',
    maxBudget: '',
    description: '',
    deliverables: '',
    proposalDeadline: '',
    visibility: 'PUBLIC_TO_MATCHING_VENDORS',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadData() {
    try {
      setLoading(true);
      const [requestData, categoryData] = await Promise.all([
        getJson('/service-requests'),
        getJson('/categories'),
      ]);
      setRequests(
        Array.isArray(requestData)
          ? requestData.filter((item) => item.weddingId === params.weddingId)
          : [],
      );
      setCategories(Array.isArray(categoryData) ? categoryData : []);
      setError('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load service requests',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.weddingId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError('Requirement title and details are required.');
      return;
    }

    try {
      setError('');
      setSuccess('');
      await postJson('/service-requests', {
        ...form,
        weddingId: params.weddingId,
        guestCount: form.guestCount ? Number(form.guestCount) : undefined,
        minBudget: form.minBudget ? Number(form.minBudget) : undefined,
        maxBudget: form.maxBudget ? Number(form.maxBudget) : undefined,
      });
      setForm({
        title: '',
        categorySlug: 'catering',
        city: '',
        venue: '',
        eventDate: '',
        startTime: '',
        guestCount: '',
        minBudget: '',
        maxBudget: '',
        description: '',
        deliverables: '',
        proposalDeadline: '',
        visibility: 'PUBLIC_TO_MATCHING_VENDORS',
      });
      setSuccess('Service request created.');
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not create service request',
      );
    }
  }

  async function publishRequest(requestId: string) {
    try {
      setError('');
      setSuccess('');
      const published = await postJson(
        `/service-requests/${requestId}/publish`,
        {},
      );
      setSelectedRequest(published);
      setSuccess('Request published to matching vendors.');
      await loadData();
      await loadMatches(requestId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not publish request',
      );
    }
  }

  async function closeRequest(requestId: string) {
    try {
      setError('');
      setSuccess('');
      await postJson(`/service-requests/${requestId}/close`, {});
      setSuccess('Request closed.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not close request');
    }
  }

  async function loadMatches(requestId: string) {
    try {
      setError('');
      const data = await getJson(
        `/service-requests/${requestId}/matching-vendors`,
      );
      setMatches(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load matches');
    }
  }

  async function inviteVendor(requestId: string, vendorId: string) {
    try {
      setError('');
      setSuccess('');
      await postJson(`/service-requests/${requestId}/invite-vendor`, {
        vendorId,
      });
      setSuccess('Vendor invited.');
      await loadData();
      await loadMatches(requestId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not invite vendor');
    }
  }

  return (
    <PlannerShell weddingId={params.weddingId}>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-400">
              Service requests
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              Post vendor requirements
            </h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Create structured requirements, publish them, and invite matching
              vendors based on category, city, date, budget, verification, and
              capacity.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/customer/proposals"
              className="rounded-lg border border-amber-400/40 px-4 py-2 text-sm font-medium text-amber-300 hover:bg-amber-400/10"
            >
              Review proposals
            </Link>
            <div className="rounded-full border border-amber-400/40 px-4 py-2 text-sm text-amber-300">
              {requests.length} requests
            </div>
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
            placeholder="Requirement title"
            aria-label="Requirement title"
            required
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <select
            value={form.categorySlug}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                categorySlug: event.target.value,
              }))
            }
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
            aria-label="Service category"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            value={form.city}
            onChange={(event) =>
              setForm((current) => ({ ...current, city: event.target.value }))
            }
            placeholder="City"
            aria-label="City"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <input
            value={form.venue}
            onChange={(event) =>
              setForm((current) => ({ ...current, venue: event.target.value }))
            }
            placeholder="Venue"
            aria-label="Venue"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <input
            value={form.eventDate}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                eventDate: event.target.value,
              }))
            }
            type="date"
            aria-label="Event date"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <input
            value={form.startTime}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                startTime: event.target.value,
              }))
            }
            type="time"
            aria-label="Start time"
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
            min="1"
            aria-label="Guest count"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.minBudget}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  minBudget: event.target.value,
                }))
              }
              placeholder="Min budget"
              type="number"
              min="0"
              aria-label="Minimum budget"
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
            />
            <input
              value={form.maxBudget}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  maxBudget: event.target.value,
                }))
              }
              placeholder="Max budget"
              type="number"
              min="0"
              aria-label="Maximum budget"
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
            />
          </div>
          <input
            value={form.deliverables}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                deliverables: event.target.value,
              }))
            }
            placeholder="Deliverables, comma separated"
            aria-label="Deliverables"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <input
            value={form.proposalDeadline}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                proposalDeadline: event.target.value,
              }))
            }
            type="date"
            aria-label="Proposal deadline"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <select
            value={form.visibility}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                visibility: event.target.value,
              }))
            }
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 md:col-span-2"
            aria-label="Request visibility"
          >
            {visibilityOptions.map((option) => (
              <option key={option} value={option}>
                {option.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            placeholder="Requirement details"
            aria-label="Requirement details"
            required
            className="min-h-24 rounded-lg border border-white/10 bg-white/10 px-3 py-2 md:col-span-2"
          />
          <button
            type="submit"
            className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-slate-950 md:col-span-2 md:ml-auto"
          >
            Create request
          </button>
        </form>

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
        {loading ? (
          <p className="mt-6 text-sm text-slate-400">Loading requests...</p>
        ) : null}

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <section className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm text-amber-300">
                      {request.category?.name ||
                        request.visibility?.replaceAll('_', ' ')}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">
                      {request.title}
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      {request.city || 'City not set'} -{' '}
                      {request.guestCount || 0} guests - PKR{' '}
                      {Number(request.maxBudget || 0).toLocaleString()}
                    </p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-300">
                    {request.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-300">
                  {request.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void publishRequest(request.id)}
                    className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-slate-950"
                  >
                    Publish
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRequest(request);
                      void loadMatches(request.id);
                    }}
                    className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
                  >
                    View matches
                  </button>
                  <Link
                    href={`/customer/proposals?requestId=${request.id}`}
                    className="rounded-lg border border-emerald-400/40 px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-400/10"
                  >
                    Proposals
                  </Link>
                  <button
                    type="button"
                    onClick={() => void closeRequest(request.id)}
                    className="rounded-lg border border-rose-400/30 px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/10"
                  >
                    Close
                  </button>
                </div>
              </div>
            ))}
            {!loading && requests.length === 0 ? (
              <p className="rb-empty">
                No service requests yet. Create one to start matching vendors.
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
            <h2 className="text-xl font-semibold">Matching vendors</h2>
            <p className="mt-2 text-sm text-slate-400">
              {selectedRequest
                ? selectedRequest.title
                : 'Select a request to view matches.'}
            </p>
            <div className="mt-5 space-y-4">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">
                        {match.vendor.businessName}
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {match.reasons?.join(', ') || 'Rule-based match'}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm text-emerald-300">
                      {match.score}%
                    </span>
                  </div>
                  {selectedRequest ? (
                    <button
                      type="button"
                      onClick={() =>
                        void inviteVendor(selectedRequest.id, match.vendorId)
                      }
                      className="mt-4 rounded-lg border border-amber-400/40 px-3 py-1 text-sm text-amber-300 hover:bg-amber-400/10"
                    >
                      Invite vendor
                    </button>
                  ) : null}
                </div>
              ))}
              {selectedRequest && matches.length === 0 ? (
                <p className="rb-empty text-sm">
                  Publish the request to calculate matches.
                </p>
              ) : null}
              {!selectedRequest ? (
                <p className="rb-empty text-sm">
                  Select a request to view matching vendors.
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </PlannerShell>
  );
}
