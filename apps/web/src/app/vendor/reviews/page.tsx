'use client';

import { useEffect, useState } from 'react';
import { VendorShell } from '../../components/vendor-shell';
import { getJson, postJson } from '../../lib/api';

export default function VendorReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [trust, setTrust] = useState<any>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadData() {
    try {
      const [reviewData, trustData] = await Promise.all([
        getJson('/vendor/reviews'),
        getJson('/vendor/trust'),
      ]);
      setReviews(Array.isArray(reviewData) ? reviewData : []);
      setTrust(trustData);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load reviews');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function respond(reviewId: string) {
    const response = responses[reviewId];
    if (!response?.trim()) return;
    await postJson(`/reviews/${reviewId}/vendor-response`, { response });
    setResponses((current) => ({ ...current, [reviewId]: '' }));
    await loadData();
  }

  return (
    <VendorShell>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-400">
          Reviews
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          Feedback and trust score
        </h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          Review history is tied to completed platform bookings and contributes
          to the marketplace trust score.
        </p>

        {loading ? (
          <p className="mt-6 text-sm text-slate-400">Loading reviews...</p>
        ) : null}
        {error ? <p className="mt-6 text-sm text-rose-300">{error}</p> : null}

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5">
            <p className="text-sm text-emerald-300">Trust score</p>
            <p className="mt-2 text-2xl font-semibold">
              {trust?.trustScore ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-5">
            <p className="text-sm text-amber-300">Average rating</p>
            <p className="mt-2 text-2xl font-semibold">
              {trust?.averageRating ?? 'N/A'}
            </p>
          </div>
          <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-5">
            <p className="text-sm text-sky-300">Reviews</p>
            <p className="mt-2 text-2xl font-semibold">
              {trust?.reviewCount ?? reviews.length}
            </p>
          </div>
          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-5">
            <p className="text-sm text-rose-300">Open disputes</p>
            <p className="mt-2 text-2xl font-semibold">
              {trust?.openDisputes ?? 0}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {trust?.signals?.map((signal: any) => (
            <div
              key={signal.id}
              className="rounded-xl border border-white/10 bg-slate-900/70 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-medium">{signal.label}</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {signal.type?.replaceAll('_', ' ')}
                  </p>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-300">
                  {signal.score}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-4">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-2xl border border-white/10 bg-slate-900/70 p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm text-amber-300">
                    {review.customer?.fullName || review.customer?.email}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">
                    {review.title || 'Customer review'}
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">
                    {review.rating}/5 overall -{' '}
                    {review.wouldRecommend ? 'Recommended' : 'Not recommended'}
                  </p>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-300">
                  {review.status}
                </span>
              </div>
              <p className="mt-4 text-sm text-slate-300">
                {review.comment || 'No comment added.'}
              </p>
              {review.vendorResponse ? (
                <p className="mt-4 rounded-xl bg-white/5 p-3 text-sm text-slate-300">
                  Your response: {review.vendorResponse}
                </p>
              ) : null}
              <div className="mt-4 flex flex-col gap-3 md:flex-row">
                <input
                  value={responses[review.id] || ''}
                  onChange={(event) =>
                    setResponses((current) => ({
                      ...current,
                      [review.id]: event.target.value,
                    }))
                  }
                  placeholder="Write a public response"
                  className="flex-1 rounded-lg border border-white/10 bg-white/10 px-3 py-2"
                />
                <button
                  onClick={() => void respond(review.id)}
                  className="rounded-lg border border-amber-400/40 px-4 py-2 text-sm font-medium text-amber-300 hover:bg-amber-400/10"
                >
                  Respond
                </button>
              </div>
            </article>
          ))}
        </div>

        {!loading && reviews.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300">
            No customer reviews yet.
          </p>
        ) : null}
      </section>
    </VendorShell>
  );
}
