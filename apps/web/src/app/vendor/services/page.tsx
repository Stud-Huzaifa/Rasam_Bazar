'use client';

import { useEffect, useState } from 'react';
import { VendorShell } from '../../components/vendor-shell';
import { deleteJson, getJson, postJson } from '../../lib/api';

const pricingModels = [
  'FIXED',
  'PER_EVENT',
  'PER_HOUR',
  'PER_GUEST',
  'STARTING_FROM',
  'CUSTOM_QUOTE',
];

export default function VendorServicesPage() {
  const [vendor, setVendor] = useState<any>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    categorySlug: 'photography',
    pricingModel: 'STARTING_FROM',
    startingPrice: '',
    serviceAreas: '',
    capacity: '',
    inclusions: '',
    exclusions: '',
    addOns: '',
    leadTimeDays: '',
    cancellationPolicy: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadVendor() {
    try {
      setVendor(await getJson('/vendors/me'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load services');
    }
  }

  useEffect(() => {
    void loadVendor();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!vendor?.id || !form.title.trim()) return;
    setIsSubmitting(true);
    setError('');

    try {
      await postJson(`/vendors/${vendor.id}/services`, form);
      setForm({
        title: '',
        description: '',
        categorySlug: 'photography',
        pricingModel: 'STARTING_FROM',
        startingPrice: '',
        serviceAreas: '',
        capacity: '',
        inclusions: '',
        exclusions: '',
        addOns: '',
        leadTimeDays: '',
        cancellationPolicy: '',
      });
      await loadVendor();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add service');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(serviceId: string) {
    await deleteJson(`/services/${serviceId}`);
    await loadVendor();
  }

  return (
    <VendorShell>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-400">
          Services
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Create vendor services</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          Describe what customers can book, where you serve, pricing model,
          capacity, inclusions, exclusions, and cancellation policy.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 grid gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-5 md:grid-cols-2"
        >
          <input
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="Service title"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <input
            value={form.categorySlug}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                categorySlug: event.target.value,
              }))
            }
            placeholder="Category slug"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <select
            value={form.pricingModel}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                pricingModel: event.target.value,
              }))
            }
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          >
            {pricingModels.map((model) => (
              <option key={model} value={model}>
                {model.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
          <input
            value={form.startingPrice}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                startingPrice: event.target.value,
              }))
            }
            placeholder="Starting price"
            type="number"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <input
            value={form.serviceAreas}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                serviceAreas: event.target.value,
              }))
            }
            placeholder="Service areas, comma separated"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <input
            value={form.capacity}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                capacity: event.target.value,
              }))
            }
            placeholder="Guest capacity"
            type="number"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            placeholder="Description"
            className="min-h-24 rounded-lg border border-white/10 bg-white/10 px-3 py-2 md:col-span-2"
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
            value={form.leadTimeDays}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                leadTimeDays: event.target.value,
              }))
            }
            placeholder="Lead time days"
            type="number"
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
          <button
            disabled={isSubmitting || !vendor?.id}
            className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-slate-950 md:col-span-2 md:ml-auto disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Saving...' : 'Add service'}
          </button>
        </form>

        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

        <div className="mt-8 space-y-4">
          {(vendor?.services || []).map((service: any) => (
            <div
              key={service.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm text-amber-300">
                    {service.category?.name || service.pricingModel}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">
                    {service.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">
                    {service.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDelete(service.id)}
                  className="rounded-lg border border-rose-400/30 px-3 py-1 text-sm text-rose-300 hover:bg-rose-500/10"
                >
                  Deactivate
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </VendorShell>
  );
}
