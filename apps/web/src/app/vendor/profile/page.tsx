'use client';

import { useEffect, useState } from 'react';
import { VendorShell } from '../../components/vendor-shell';
import { getJson, patchJson, postJson } from '../../lib/api';

export default function VendorProfilePage() {
  const [vendor, setVendor] = useState<any>(null);
  const [form, setForm] = useState({
    businessName: '',
    ownerName: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    serviceAreas: '',
    yearsOfExperience: '',
    teamSize: '',
    startingPrice: '',
    logoUrl: '',
  });
  const [portfolioForm, setPortfolioForm] = useState({
    title: '',
    imageUrl: '',
    description: '',
    isFeatured: false,
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadVendor() {
    try {
      const data = await getJson('/vendors/me');
      setVendor(data);
      setForm({
        businessName: data.businessName || '',
        ownerName: data.ownerName || '',
        description: data.description || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        city: data.city || '',
        serviceAreas: (data.serviceAreas || []).join(', '),
        yearsOfExperience: data.yearsOfExperience?.toString() || '',
        teamSize: data.teamSize?.toString() || '',
        startingPrice: data.startingPrice?.toString() || '',
        logoUrl: data.logoUrl || '',
      });
    } catch {
      setVendor(null);
    }
  }

  useEffect(() => {
    void loadVendor();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      const payload = {
        ...form,
        yearsOfExperience: Number(form.yearsOfExperience || 0),
        teamSize: Number(form.teamSize || 0),
        startingPrice: Number(form.startingPrice || 0),
      };
      const saved = vendor?.id
        ? await patchJson(`/vendors/${vendor.id}`, payload)
        : await postJson('/vendors', payload);
      setVendor(saved);
      await loadVendor();
      setMessage('Vendor profile saved.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save vendor profile',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePortfolioSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (
      !vendor?.id ||
      !portfolioForm.title.trim() ||
      !portfolioForm.imageUrl.trim()
    )
      return;

    setError('');
    setMessage('');

    try {
      await postJson(`/vendors/${vendor.id}/portfolio`, portfolioForm);
      setPortfolioForm({
        title: '',
        imageUrl: '',
        description: '',
        isFeatured: false,
      });
      setMessage('Portfolio item added.');
      await loadVendor();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not add portfolio item',
      );
    }
  }

  return (
    <VendorShell>
      <div className="space-y-6">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10"
        >
          <p className="text-sm uppercase tracking-[0.3em] text-amber-400">
            Vendor profile
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Business profile</h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            Keep the public vendor profile accurate for customers browsing the
            marketplace.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              ['businessName', 'Business name'],
              ['ownerName', 'Owner name'],
              ['phone', 'Phone'],
              ['email', 'Email'],
              ['address', 'Address'],
              ['city', 'City'],
              ['serviceAreas', 'Service areas'],
              ['yearsOfExperience', 'Years of experience'],
              ['teamSize', 'Team size'],
              ['startingPrice', 'Starting price'],
              ['logoUrl', 'Logo URL'],
            ].map(([key, label]) => (
              <label
                key={key}
                className="block text-sm font-medium text-slate-300"
              >
                {label}
                <input
                  value={(form as any)[key]}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2"
                />
              </label>
            ))}
            <label className="block text-sm font-medium text-slate-300 md:col-span-2">
              Description
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className="mt-2 min-h-28 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2"
              />
            </label>
          </div>

          {message ? (
            <p className="mt-4 text-sm text-emerald-300">{message}</p>
          ) : null}
          {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
          <button
            disabled={isSubmitting}
            className="mt-8 rounded-lg bg-amber-500 px-5 py-3 font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Saving...' : 'Save profile'}
          </button>
        </form>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-400">
            Portfolio
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Public work samples</h2>
          <p className="mt-3 max-w-2xl text-slate-300">
            Use image URLs for the academic version. Cloudinary/Supabase uploads
            can replace this later without changing the profile flow.
          </p>

          <form
            onSubmit={handlePortfolioSubmit}
            className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-5 md:grid-cols-2"
          >
            <input
              value={portfolioForm.title}
              onChange={(event) =>
                setPortfolioForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Portfolio title"
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
            />
            <input
              value={portfolioForm.imageUrl}
              onChange={(event) =>
                setPortfolioForm((current) => ({
                  ...current,
                  imageUrl: event.target.value,
                }))
              }
              placeholder="Image URL"
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
            />
            <textarea
              value={portfolioForm.description}
              onChange={(event) =>
                setPortfolioForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Description"
              className="min-h-20 rounded-lg border border-white/10 bg-white/10 px-3 py-2 md:col-span-2"
            />
            <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={portfolioForm.isFeatured}
                onChange={(event) =>
                  setPortfolioForm((current) => ({
                    ...current,
                    isFeatured: event.target.checked,
                  }))
                }
              />
              Featured
            </label>
            <button
              disabled={!vendor?.id}
              className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-slate-950 md:ml-auto disabled:cursor-not-allowed disabled:opacity-70"
            >
              Add portfolio item
            </button>
          </form>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {(vendor?.portfolio || []).map((item: any) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <div className="aspect-video rounded-xl border border-white/10 bg-slate-900/70" />
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-400">
                  {item.description || item.imageUrl}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </VendorShell>
  );
}
