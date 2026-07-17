'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getJson, postJson } from '../../lib/api';

export default function CustomerReviewsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [form, setForm] = useState({
    bookingId: '',
    rating: '5',
    communicationRating: '5',
    qualityRating: '5',
    valueRating: '5',
    professionalismRating: '5',
    title: '',
    comment: '',
    tags: '',
    wouldRecommend: true,
  });
  const [dispute, setDispute] = useState({
    bookingId: '',
    reason: '',
    details: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadData() {
    try {
      const [bookingData, reviewData] = await Promise.all([
        getJson('/customer/bookings'),
        getJson('/customer/reviews'),
      ]);
      const bookingList = Array.isArray(bookingData) ? bookingData : [];
      setBookings(bookingList);
      setReviews(Array.isArray(reviewData) ? reviewData : []);
      setForm((current) => ({
        ...current,
        bookingId: current.bookingId || bookingList[0]?.id || '',
      }));
      setDispute((current) => ({
        ...current,
        bookingId: current.bookingId || bookingList[0]?.id || '',
      }));
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

  async function submitReview(event: React.FormEvent) {
    event.preventDefault();
    if (!form.bookingId) return;
    try {
      setError('');
      setSuccess('');
      await postJson(`/bookings/${form.bookingId}/review`, {
        ...form,
        rating: Number(form.rating),
        communicationRating: Number(form.communicationRating),
        qualityRating: Number(form.qualityRating),
        valueRating: Number(form.valueRating),
        professionalismRating: Number(form.professionalismRating),
      });
      setForm((current) => ({ ...current, title: '', comment: '', tags: '' }));
      setSuccess('Review submitted successfully.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit review');
    }
  }

  async function openDispute(event: React.FormEvent) {
    event.preventDefault();
    if (!dispute.bookingId || !dispute.reason) return;
    try {
      setError('');
      setSuccess('');
      await postJson(`/bookings/${dispute.bookingId}/disputes`, dispute);
      setDispute((current) => ({ ...current, reason: '', details: '' }));
      setSuccess('Dispute opened and sent to support.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open dispute');
    }
  }

  return (
    <main
      id="main-content"
      className="min-h-screen bg-slate-950 px-6 py-16 text-white"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-400">
              Reviews
            </p>
            <h1 className="mt-2 text-4xl font-semibold">
              Share booking feedback
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-300">
              Rate completed vendors, leave private context through disputes,
              and keep feedback tied to real bookings.
            </p>
          </div>
          <Link
            href="/customer/bookings"
            className="rounded-lg border border-amber-400/40 px-4 py-2 text-sm font-medium text-amber-300 hover:bg-amber-400/10"
          >
            Bookings
          </Link>
        </div>

        {loading ? (
          <p className="mt-8 text-sm text-slate-400">Loading reviews...</p>
        ) : null}
        {error ? (
          <p role="alert" className="mt-8 rb-alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p role="status" aria-live="polite" className="mt-8 rb-success">
            {success}
          </p>
        ) : null}

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.8fr]">
          <form
            onSubmit={submitReview}
            className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 md:grid-cols-2"
          >
            <select
              value={form.bookingId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  bookingId: event.target.value,
                }))
              }
              aria-label="Booking to review"
              required
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 md:col-span-2"
            >
              <option value="">Select booking</option>
              {bookings.map((booking) => (
                <option key={booking.id} value={booking.id}>
                  {booking.title}
                </option>
              ))}
            </select>
            {[
              'rating',
              'communicationRating',
              'qualityRating',
              'valueRating',
              'professionalismRating',
            ].map((field) => (
              <label key={field} className="text-sm text-slate-300">
                {field.replace('Rating', '').replace('rating', 'Overall') ||
                  'Overall'}
                <select
                  value={(form as any)[field]}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [field]: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2"
                  aria-label={`${field} score`}
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <input
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Review title"
              aria-label="Review title"
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
            />
            <input
              value={form.tags}
              onChange={(event) =>
                setForm((current) => ({ ...current, tags: event.target.value }))
              }
              placeholder="Tags, comma separated"
              aria-label="Review tags"
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
            />
            <textarea
              value={form.comment}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  comment: event.target.value,
                }))
              }
              placeholder="What should other families know?"
              aria-label="Review comment"
              className="min-h-28 rounded-lg border border-white/10 bg-white/10 px-3 py-2 md:col-span-2"
            />
            <label className="flex items-center gap-3 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.wouldRecommend}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    wouldRecommend: event.target.checked,
                  }))
                }
              />
              Would recommend this vendor
            </label>
            <button
              disabled={!form.bookingId}
              className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-slate-950 disabled:opacity-70 md:ml-auto"
            >
              Submit review
            </button>
          </form>

          <form
            onSubmit={openDispute}
            className="rounded-2xl border border-white/10 bg-white/5 p-5"
          >
            <h2 className="text-xl font-semibold">Dispute note</h2>
            <p className="mt-2 text-sm text-slate-400">
              Use this for payment, quality, or agreement issues that should
              stay attached to the booking.
            </p>
            <select
              value={dispute.bookingId}
              onChange={(event) =>
                setDispute((current) => ({
                  ...current,
                  bookingId: event.target.value,
                }))
              }
              aria-label="Booking for dispute"
              required
              className="mt-5 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2"
            >
              <option value="">Select booking</option>
              {bookings.map((booking) => (
                <option key={booking.id} value={booking.id}>
                  {booking.title}
                </option>
              ))}
            </select>
            <input
              value={dispute.reason}
              onChange={(event) =>
                setDispute((current) => ({
                  ...current,
                  reason: event.target.value,
                }))
              }
              placeholder="Reason"
              aria-label="Dispute reason"
              required
              className="mt-4 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2"
            />
            <textarea
              value={dispute.details}
              onChange={(event) =>
                setDispute((current) => ({
                  ...current,
                  details: event.target.value,
                }))
              }
              placeholder="Details"
              aria-label="Dispute details"
              className="mt-4 min-h-28 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2"
            />
            <button
              disabled={!dispute.bookingId || !dispute.reason}
              className="mt-4 rounded-lg border border-rose-400/40 px-4 py-2 text-sm font-medium text-rose-300 hover:bg-rose-400/10 disabled:opacity-70"
            >
              Open dispute
            </button>
          </form>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-amber-300">
                    {review.vendor?.businessName}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">
                    {review.title || 'Vendor review'}
                  </h2>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm text-emerald-300">
                  {review.rating}/5
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-300">
                {review.comment || 'No comment added.'}
              </p>
              {review.vendorResponse ? (
                <p className="mt-3 rounded-xl bg-slate-900/70 p-3 text-sm text-slate-300">
                  Vendor response: {review.vendorResponse}
                </p>
              ) : null}
            </article>
          ))}
        </div>
        {!loading && reviews.length === 0 ? (
          <p className="mt-8 rb-empty">
            No reviews yet. Completed bookings will appear here for feedback.
          </p>
        ) : null}
      </div>
    </main>
  );
}
