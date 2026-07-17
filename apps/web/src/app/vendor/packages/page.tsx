'use client';

import { useEffect, useState } from 'react';
import { VendorShell } from '../../components/vendor-shell';
import { getJson, patchJson, postJson } from '../../lib/api';

export default function VendorPackagesPage() {
  const [vendor, setVendor] = useState<any>(null);
  const [form, setForm] = useState({
    serviceId: '',
    name: '',
    description: '',
    price: '',
    includedItems: '',
    excludedItems: '',
    addOns: '',
    eventCoverage: '',
    teamSize: '',
    deliveryTimeline: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadVendor() {
    try {
      const data = await getJson('/vendors/me');
      setVendor(data);
      if (!form.serviceId && data.services?.[0]?.id) {
        setForm((current) => ({ ...current, serviceId: data.services[0].id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load packages');
    }
  }

  useEffect(() => {
    void loadVendor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.serviceId || !form.name.trim()) return;
    setIsSubmitting(true);
    setError('');

    try {
      await postJson(`/services/${form.serviceId}/packages`, form);
      setForm((current) => ({
        ...current,
        name: '',
        description: '',
        price: '',
        includedItems: '',
        excludedItems: '',
        addOns: '',
        eventCoverage: '',
        teamSize: '',
        deliveryTimeline: '',
      }));
      await loadVendor();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add package');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deactivatePackage(packageId: string) {
    await patchJson(`/packages/${packageId}`, { isActive: false });
    await loadVendor();
  }

  return (
    <VendorShell>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-400">
          Packages
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          Bundle services into packages
        </h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          Create clear package options with price, included items, exclusions,
          add-ons, event coverage, team size, and delivery timeline.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 grid gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-5 md:grid-cols-2"
        >
          <select
            value={form.serviceId}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                serviceId: event.target.value,
              }))
            }
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 md:col-span-2"
          >
            {(vendor?.services || []).map((service: any) => (
              <option key={service.id} value={service.id}>
                {service.title}
              </option>
            ))}
          </select>
          <input
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Package name"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <input
            value={form.price}
            onChange={(event) =>
              setForm((current) => ({ ...current, price: event.target.value }))
            }
            placeholder="Price"
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
            className="min-h-20 rounded-lg border border-white/10 bg-white/10 px-3 py-2 md:col-span-2"
          />
          <input
            value={form.includedItems}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                includedItems: event.target.value,
              }))
            }
            placeholder="Included items"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <input
            value={form.excludedItems}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                excludedItems: event.target.value,
              }))
            }
            placeholder="Excluded items"
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
            value={form.eventCoverage}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                eventCoverage: event.target.value,
              }))
            }
            placeholder="Event coverage"
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
            value={form.deliveryTimeline}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                deliveryTimeline: event.target.value,
              }))
            }
            placeholder="Delivery timeline"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
          <button
            disabled={isSubmitting || !form.serviceId}
            className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-slate-950 md:col-span-2 md:ml-auto disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Saving...' : 'Add package'}
          </button>
        </form>

        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {(vendor?.packages || []).map((item: any) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{item.name}</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    {item.description || item.eventCoverage}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm text-emerald-300">
                  PKR {Number(item.price || 0).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => void deactivatePackage(item.id)}
                className="mt-4 rounded-lg border border-rose-400/30 px-3 py-1 text-sm text-rose-300 hover:bg-rose-500/10"
              >
                Deactivate
              </button>
            </div>
          ))}
        </div>
      </section>
    </VendorShell>
  );
}
