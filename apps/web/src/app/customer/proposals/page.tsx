'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getJson, postJson } from '../../lib/api';

export default function CustomerProposalsPage() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [comparison, setComparison] = useState<any>(null);
  const [revisionComment, setRevisionComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadProposals() {
    try {
      const data = await getJson('/customer/proposals');
      const proposalList = Array.isArray(data) ? data : [];
      const requestedId =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('requestId')
          : '';
      const nextRequestId =
        requestedId &&
        proposalList.some(
          (proposal) => proposal.serviceRequestId === requestedId,
        )
          ? requestedId
          : selectedRequestId || proposalList[0]?.serviceRequestId || '';

      setProposals(proposalList);
      if (nextRequestId) {
        setSelectedRequestId(nextRequestId);
        await loadComparison(nextRequestId);
      }
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load proposals');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProposals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadComparison(requestId: string) {
    if (!requestId) return;
    const data = await getJson(
      `/service-requests/${requestId}/proposals/compare`,
    );
    setComparison(data);
  }

  async function action(path: string, label: string) {
    try {
      setError('');
      setSuccess('');
      await postJson(path, { comment: revisionComment });
      setRevisionComment('');
      setSuccess(`${label} completed.`);
      await loadProposals();
      if (selectedRequestId) await loadComparison(selectedRequestId);
    } catch (err) {
      setError(err instanceof Error ? err.message : `${label} failed`);
    }
  }

  const requestIds = Array.from(
    new Set(proposals.map((proposal) => proposal.serviceRequestId)),
  );

  return (
    <main id="main-content" className="rb-page px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="rb-kicker">Customer proposals</p>
            <h1 className="rb-heading mt-2 text-6xl">
              Compare vendor quotations
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-[var(--rb-muted)]">
              Review submitted proposals side by side, request revisions,
              shortlist, accept, or reject.
            </p>
          </div>
          <Link
            href="/customer/bookings"
            className="rb-button rb-button-secondary"
          >
            View bookings
          </Link>
        </div>

        {loading ? (
          <p className="mt-8 text-sm text-[var(--rb-muted)]">
            Loading proposals...
          </p>
        ) : null}
        {error ? (
          <p className="mt-8 rb-card border-[var(--rb-error)] p-4 text-sm font-semibold text-[var(--rb-error)]">
            <span role="alert">{error}</span>
          </p>
        ) : null}
        {success ? (
          <p role="status" aria-live="polite" className="mt-8 rb-success">
            {success}
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 rb-card p-5 md:flex-row">
          <select
            value={selectedRequestId}
            onChange={(event) => {
              setSelectedRequestId(event.target.value);
              void loadComparison(event.target.value);
            }}
            className="rb-input flex-1"
            aria-label="Service request"
          >
            <option value="">Select service request</option>
            {requestIds.map((requestId) => {
              const proposal = proposals.find(
                (item) => item.serviceRequestId === requestId,
              );
              return (
                <option key={requestId} value={requestId}>
                  {proposal?.serviceRequest?.title || requestId}
                </option>
              );
            })}
          </select>
          <button
            type="button"
            onClick={() => void loadComparison(selectedRequestId)}
            disabled={!selectedRequestId}
            className="rb-button rb-button-primary"
          >
            Compare Karein
          </button>
        </div>

        <input
          value={revisionComment}
          onChange={(event) => setRevisionComment(event.target.value)}
          placeholder="Revision/rejection comment"
          className="rb-input mt-4"
          aria-label="Revision or rejection comment"
        />

        <div className="mt-8 overflow-x-auto rb-card">
          <table className="rb-table min-w-full text-sm">
            <thead className="bg-[var(--rb-ivory)]">
              <tr>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Advance</th>
                <th className="px-4 py-3">Inclusions</th>
                <th className="px-4 py-3">Verification</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(comparison?.proposals || proposals).map((proposal: any) => {
                const latest = proposal.latestVersion || proposal.versions?.[0];
                const proposalId = proposal.id;
                return (
                  <tr key={proposalId}>
                    <td className="px-4 py-3 font-bold text-[var(--rb-burgundy-dark)]">
                      {proposal.vendor?.businessName}
                    </td>
                    <td className="px-4 py-3">
                      PKR{' '}
                      {Number(
                        latest?.totalPrice || proposal.totalPrice || 0,
                      ).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      PKR{' '}
                      {Number(
                        latest?.advanceAmount || proposal.advanceAmount || 0,
                      ).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {(latest?.inclusions || proposal.inclusions || [])
                        .slice(0, 3)
                        .join(', ')}
                    </td>
                    <td className="px-4 py-3">
                      {proposal.vendor?.verificationLevel ||
                        proposal.verificationLevel}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rb-badge">{proposal.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            void action(
                              `/proposals/${proposalId}/shortlist`,
                              'Shortlist',
                            )
                          }
                          className="rb-badge"
                        >
                          Shortlist
                        </button>
                        <button
                          onClick={() =>
                            void action(
                              `/proposals/${proposalId}/request-revision`,
                              'Revision request',
                            )
                          }
                          className="rb-badge"
                        >
                          Revise
                        </button>
                        <button
                          onClick={() =>
                            void action(
                              `/proposals/${proposalId}/accept`,
                              'Proposal acceptance',
                            )
                          }
                          className="rb-badge rb-status-success"
                        >
                          Booking Confirm Karein
                        </button>
                        <button
                          onClick={() =>
                            void action(
                              `/proposals/${proposalId}/reject`,
                              'Proposal rejection',
                            )
                          }
                          className="rb-badge rb-status-danger"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!loading && proposals.length === 0 ? (
          <p className="mt-8 rb-card p-6 text-[var(--rb-muted)]">
            Filhaal koi proposal nahi aayi. Matching vendors ko notify kar diya
            gaya hai.
          </p>
        ) : null}
      </div>
    </main>
  );
}
