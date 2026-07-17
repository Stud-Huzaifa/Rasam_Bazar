'use client';

import { useEffect, useState } from 'react';
import { VendorShell } from '../../components/vendor-shell';
import { getJson, postJson } from '../../lib/api';

const documentTypes = [
  'CNIC',
  'ADDRESS_PROOF',
  'BUSINESS_REGISTRATION',
  'BANK_ACCOUNT',
  'PORTFOLIO',
  'CLIENT_REFERENCE',
  'OTHER',
];

export default function VendorVerificationPage() {
  const [vendor, setVendor] = useState<any>(null);
  const [form, setForm] = useState({
    documentType: 'CNIC',
    documentUrl: '',
    notes: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadVendor() {
    try {
      setVendor(await getJson('/vendors/me'));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load vendor profile',
      );
    }
  }

  useEffect(() => {
    void loadVendor();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!vendor?.id) return;
    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      await postJson(`/vendors/${vendor.id}/verification`, form);
      setMessage('Verification document submitted for review.');
      setForm({ documentType: 'CNIC', documentUrl: '', notes: '' });
      await loadVendor();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not submit verification',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <VendorShell>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-400">
          Verification
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Build customer trust</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          Submit fictional academic verification records. Private file storage
          integration is a later production step.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
            <p className="text-sm text-slate-400">Status</p>
            <p className="mt-2 text-xl font-semibold">
              {vendor?.verificationStatus || 'NOT_SUBMITTED'}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5">
            <p className="text-sm text-emerald-300">Level</p>
            <p className="mt-2 text-xl font-semibold">
              {vendor?.verificationLevel || 'UNVERIFIED'}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-5">
            <p className="text-sm text-amber-300">Documents</p>
            <p className="mt-2 text-xl font-semibold">
              {vendor?.verifications?.length || 0}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 grid gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-5 md:grid-cols-2"
        >
          <select
            value={form.documentType}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                documentType: event.target.value,
              }))
            }
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          >
            {documentTypes.map((type) => (
              <option key={type} value={type}>
                {type.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
          <input
            value={form.documentUrl}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                documentUrl: event.target.value,
              }))
            }
            placeholder="Document URL or reference"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <textarea
            value={form.notes}
            onChange={(event) =>
              setForm((current) => ({ ...current, notes: event.target.value }))
            }
            placeholder="Notes"
            className="min-h-24 rounded-lg border border-white/10 bg-white/10 px-3 py-2 md:col-span-2"
          />
          <button
            disabled={isSubmitting || !vendor?.id}
            className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-slate-950 md:col-span-2 md:ml-auto disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Submitting...' : 'Submit document'}
          </button>
        </form>

        {message ? (
          <p className="mt-4 text-sm text-emerald-300">{message}</p>
        ) : null}
        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

        <div className="mt-8 space-y-4">
          {(vendor?.verifications || []).map((item: any) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-semibold">
                  {item.documentType.replaceAll('_', ' ')}
                </h2>
                <span className="rounded-full bg-amber-500/15 px-3 py-1 text-sm text-amber-300">
                  {item.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                {item.notes || item.documentUrl || 'No notes provided'}
              </p>
            </div>
          ))}
        </div>
      </section>
    </VendorShell>
  );
}
