'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getJson, postJson } from '../../lib/api';

export default function VendorPublicProfilePage({
  params,
}: {
  params: { vendorId: string };
}) {
  const [vendor, setVendor] = useState<any>(null);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    eventDate: '',
    guestCount: '',
    message: '',
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadVendor() {
      try {
        setVendor(await getJson(`/vendors/${params.vendorId}`));
        setError('');
      } catch (err) {
        setVendor(null);
        setError(
          err instanceof Error ? err.message : 'Could not load vendor profile',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadVendor();
  }, [params.vendorId]);

  async function handleInquirySubmit(event: React.FormEvent) {
    event.preventDefault();
    if (
      !inquiryForm.name.trim() ||
      !inquiryForm.email.trim() ||
      !inquiryForm.message.trim()
    )
      return;

    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      await postJson(`/vendors/${params.vendorId}/inquiries`, {
        ...inquiryForm,
        guestCount: inquiryForm.guestCount
          ? Number(inquiryForm.guestCount)
          : undefined,
      });
      setInquiryForm({
        name: '',
        email: '',
        phone: '',
        city: '',
        eventDate: '',
        guestCount: '',
        message: '',
      });
      setMessage('Request bhej di gayi hai. Vendor jaldi aap se rabta karega.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send inquiry');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main id="main-content" className="rb-page px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/marketplace"
          className="text-sm font-bold text-[var(--rb-burgundy)]"
        >
          Marketplace par wapas
        </Link>

        {loading ? (
          <p className="mt-8 rb-card p-5 text-sm text-[var(--rb-muted)]">
            Loading vendor...
          </p>
        ) : null}
        {error ? (
          <p
            role="alert"
            className="mt-8 rb-card border-[var(--rb-error)] p-5 text-sm text-[var(--rb-error)]"
          >
            {error}
          </p>
        ) : null}

        {vendor ? (
          <div className="mt-8 space-y-8">
            <section className="rb-card overflow-hidden">
              <div
                className="min-h-[320px] bg-cover bg-center"
                style={{
                  backgroundImage:
                    'linear-gradient(90deg, rgba(66,17,38,0.82), rgba(66,17,38,0.18)), url(https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1400&q=80)',
                }}
              >
                <div className="flex min-h-[320px] flex-col justify-end p-8 text-white md:p-10">
                  <span className="w-fit rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[var(--rb-gold)]">
                    {vendor.verificationLevel?.replaceAll('_', ' ') ||
                      'UNVERIFIED'}
                  </span>
                  <h1 className="mt-4 text-5xl font-bold rb-serif md:text-6xl">
                    {vendor.businessName}
                  </h1>
                  <p className="mt-4 max-w-3xl text-lg leading-8 text-white/82">
                    {vendor.description ||
                      'Apni shaadi ke liye trusted vendor profile.'}
                  </p>
                  <p className="mt-4 text-sm font-semibold text-white/72">
                    {vendor.city || 'Pakistan'} |{' '}
                    {vendor.serviceAreas?.join(', ') ||
                      'Service areas not listed'}
                  </p>
                </div>
              </div>
            </section>

            <section className="grid gap-6 md:grid-cols-4">
              <div className="rb-card-soft p-5">
                <p className="text-sm font-bold text-[var(--rb-muted)]">
                  Trust score
                </p>
                <p className="mt-2 text-2xl font-black text-[var(--rb-success)]">
                  {vendor.trustFactors?.trustScore || 0}
                </p>
              </div>
              <div className="rb-card-soft p-5">
                <p className="text-sm font-bold text-[var(--rb-muted)]">
                  Average rating
                </p>
                <p className="mt-2 text-2xl font-black text-[var(--rb-warning)]">
                  {vendor.trustFactors?.averageRating || 'N/A'}
                </p>
              </div>
              <div className="rb-card-soft p-5">
                <p className="text-sm font-bold text-[var(--rb-muted)]">
                  Reviews
                </p>
                <p className="mt-2 text-2xl font-black text-[var(--rb-burgundy)]">
                  {vendor.trustFactors?.reviewCount || 0}
                </p>
              </div>
              <div className="rb-card-soft p-5">
                <p className="text-sm font-bold text-[var(--rb-muted)]">
                  Starting price
                </p>
                <p className="mt-2 text-2xl font-black text-[var(--rb-burgundy)]">
                  PKR {Number(vendor.startingPrice || 0).toLocaleString()}
                </p>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              {(vendor.trustFactors?.trustSignals || [])
                .slice(0, 4)
                .map((signal: any) => (
                  <div key={signal.id} className="rb-card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-bold text-[var(--rb-burgundy-dark)]">
                          {signal.label}
                        </h2>
                        <p className="mt-1 text-sm text-[var(--rb-muted)]">
                          {signal.type?.replaceAll('_', ' ')}
                        </p>
                      </div>
                      <span className="rb-badge">{signal.score}</span>
                    </div>
                  </div>
                ))}
            </section>

            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              <div className="space-y-8">
                <section>
                  <p className="rb-kicker">Services</p>
                  <div className="mt-4 grid gap-6 md:grid-cols-2">
                    {(vendor.services || []).map((service: any) => (
                      <div key={service.id} className="rb-card p-6">
                        <p className="text-sm font-bold text-[var(--rb-burgundy)]">
                          {service.category?.name ||
                            service.pricingModel?.replaceAll('_', ' ')}
                        </p>
                        <h2 className="mt-2 text-2xl font-bold text-[var(--rb-burgundy-dark)] rb-serif">
                          {service.title}
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-[var(--rb-muted)]">
                          {service.description}
                        </p>
                        <p className="mt-4 text-sm font-bold text-[var(--rb-muted)]">
                          Capacity: {service.capacity || 'Custom'}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <p className="rb-kicker">Packages</p>
                  <div className="mt-4 grid gap-6 md:grid-cols-2">
                    {(vendor.packages || []).map((item: any) => (
                      <div key={item.id} className="rb-card p-6">
                        <h2 className="text-2xl font-bold text-[var(--rb-burgundy-dark)] rb-serif">
                          {item.name}
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-[var(--rb-muted)]">
                          {item.description || item.eventCoverage}
                        </p>
                        <p className="mt-5 text-xl font-black text-[var(--rb-success)]">
                          PKR {Number(item.price || 0).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <p className="rb-kicker">Portfolio</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    {(vendor.portfolio || []).map((item: any) => (
                      <div key={item.id} className="rb-card overflow-hidden">
                        <div className="aspect-video bg-[url('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=700&q=80')] bg-cover bg-center" />
                        <div className="p-5">
                          <h2 className="font-bold text-[var(--rb-burgundy-dark)]">
                            {item.title}
                          </h2>
                          <p className="mt-2 text-sm text-[var(--rb-muted)]">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rb-card p-6">
                  <h2 className="text-3xl font-bold text-[var(--rb-burgundy-dark)] rb-serif">
                    Families ka bharosa
                  </h2>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {(vendor.reviews || []).map((review: any) => (
                      <article
                        key={review.id}
                        className="rounded-xl border border-[var(--rb-border)] bg-[var(--rb-ivory)] p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold text-[var(--rb-burgundy-dark)]">
                              {review.title || 'Booking review'}
                            </h3>
                            <p className="mt-1 text-sm text-[var(--rb-muted)]">
                              {review.customer?.fullName || 'Customer'}
                            </p>
                          </div>
                          <span className="rb-badge">{review.rating}/5</span>
                        </div>
                        <p className="mt-3 text-sm text-[var(--rb-muted)]">
                          {review.comment ||
                            'Review mein koi comment add nahi hua.'}
                        </p>
                        {review.vendorResponse ? (
                          <p className="mt-3 rounded-lg bg-white p-3 text-sm text-[var(--rb-muted)]">
                            Vendor response: {review.vendorResponse}
                          </p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                  {(vendor.reviews || []).length === 0 ? (
                    <p className="mt-4 text-sm text-[var(--rb-muted)]">
                      Abhi tak public reviews nahi aaye. Pehli family ban sakti
                      hai jo feedback share kare.
                    </p>
                  ) : null}
                </section>
              </div>

              <aside className="space-y-6 lg:sticky lg:top-6 lg:h-fit">
                <section className="rb-card p-6">
                  <h2 className="text-2xl font-bold text-[var(--rb-burgundy-dark)] rb-serif">
                    Available dates
                  </h2>
                  <div className="mt-5 space-y-3">
                    {(vendor.availability || [])
                      .slice(0, 6)
                      .map((slot: any) => (
                        <div
                          key={slot.id}
                          className="rounded-xl border border-[var(--rb-border)] bg-[var(--rb-ivory)] p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-bold text-[var(--rb-burgundy-dark)]">
                              {new Date(slot.date).toLocaleDateString()}
                            </span>
                            <span className="rb-badge rb-status-success">
                              {slot.status.replaceAll('_', ' ')}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-[var(--rb-muted)]">
                            {slot.startTime || 'All day'}{' '}
                            {slot.endTime ? `- ${slot.endTime}` : ''}
                          </p>
                        </div>
                      ))}
                    {(vendor.availability || []).length === 0 ? (
                      <p className="text-sm text-[var(--rb-muted)]">
                        Dates abhi publish nahi hui. Quote mangwa kar
                        availability confirm kar lein.
                      </p>
                    ) : null}
                  </div>
                </section>

                <form onSubmit={handleInquirySubmit} className="rb-card p-6">
                  <h2 className="text-3xl font-bold text-[var(--rb-burgundy-dark)] rb-serif">
                    Quote Mangwayein
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--rb-muted)]">
                    Event details share karein, vendor aap ko structured quote
                    bhej dega.
                  </p>
                  <div className="mt-5 grid gap-3">
                    <input
                      value={inquiryForm.name}
                      onChange={(event) =>
                        setInquiryForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Your name"
                      aria-label="Your name"
                      required
                      className="rb-input"
                    />
                    <input
                      value={inquiryForm.email}
                      onChange={(event) =>
                        setInquiryForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      placeholder="Email"
                      type="email"
                      aria-label="Email"
                      required
                      className="rb-input"
                    />
                    <input
                      value={inquiryForm.phone}
                      onChange={(event) =>
                        setInquiryForm((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                      placeholder="Phone"
                      aria-label="Phone"
                      className="rb-input"
                    />
                    <input
                      value={inquiryForm.city}
                      onChange={(event) =>
                        setInquiryForm((current) => ({
                          ...current,
                          city: event.target.value,
                        }))
                      }
                      placeholder="City"
                      aria-label="City"
                      className="rb-input"
                    />
                    <input
                      value={inquiryForm.eventDate}
                      onChange={(event) =>
                        setInquiryForm((current) => ({
                          ...current,
                          eventDate: event.target.value,
                        }))
                      }
                      type="date"
                      aria-label="Event date"
                      className="rb-input"
                    />
                    <input
                      value={inquiryForm.guestCount}
                      onChange={(event) =>
                        setInquiryForm((current) => ({
                          ...current,
                          guestCount: event.target.value,
                        }))
                      }
                      placeholder="Guest count"
                      type="number"
                      min="1"
                      aria-label="Guest count"
                      className="rb-input"
                    />
                    <textarea
                      value={inquiryForm.message}
                      onChange={(event) =>
                        setInquiryForm((current) => ({
                          ...current,
                          message: event.target.value,
                        }))
                      }
                      placeholder="What do you need?"
                      aria-label="What do you need?"
                      required
                      className="rb-input min-h-28"
                    />
                  </div>
                  <button
                    disabled={isSubmitting}
                    className="rb-button rb-button-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? 'Sending...' : 'Quote Mangwayein'}
                  </button>
                  {message ? (
                    <p
                      role="status"
                      aria-live="polite"
                      className="mt-4 rounded-xl bg-[rgba(60,122,87,0.1)] p-3 text-sm font-semibold text-[var(--rb-success)]"
                    >
                      {message}
                    </p>
                  ) : null}
                </form>
              </aside>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
