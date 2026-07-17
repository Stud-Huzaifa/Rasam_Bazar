'use client';

import { useEffect, useState } from 'react';
import { VendorShell } from '../../components/vendor-shell';
import { getJson, patchJson } from '../../lib/api';

const statuses = ['NEW', 'RESPONDED', 'CLOSED'];

export default function VendorInquiriesPage() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadInquiries() {
    try {
      const data = await getJson('/vendors/me/inquiries');
      setInquiries(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load inquiries');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadInquiries();
  }, []);

  async function updateStatus(inquiryId: string, status: string) {
    await patchJson(`/vendor-inquiries/${inquiryId}`, { status });
    await loadInquiries();
  }

  return (
    <VendorShell>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-400">
              Marketplace inquiries
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Customer leads</h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Review inquiries sent from public vendor profiles and mark the
              lead status.
            </p>
          </div>
          <div className="rounded-full border border-amber-400/40 px-4 py-2 text-sm text-amber-300">
            {inquiries.filter((item) => item.status === 'NEW').length} new
          </div>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-slate-400">Loading inquiries...</p>
        ) : null}
        {error ? <p className="mt-6 text-sm text-rose-300">{error}</p> : null}

        <div className="mt-8 space-y-4">
          {inquiries.map((inquiry) => (
            <div
              key={inquiry.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{inquiry.name}</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {inquiry.email}
                    {inquiry.phone ? ` - ${inquiry.phone}` : ''}
                  </p>
                  <p className="mt-3 text-slate-300">{inquiry.message}</p>
                  <p className="mt-3 text-sm text-slate-500">
                    {inquiry.city || 'City not set'}{' '}
                    {inquiry.eventDate
                      ? `- ${new Date(inquiry.eventDate).toLocaleDateString()}`
                      : ''}{' '}
                    {inquiry.guestCount ? `- ${inquiry.guestCount} guests` : ''}
                  </p>
                </div>
                <select
                  value={inquiry.status}
                  onChange={(event) =>
                    void updateStatus(inquiry.id, event.target.value)
                  }
                  className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        {!loading && inquiries.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300">
            No inquiries yet.
          </p>
        ) : null}
      </section>
    </VendorShell>
  );
}
