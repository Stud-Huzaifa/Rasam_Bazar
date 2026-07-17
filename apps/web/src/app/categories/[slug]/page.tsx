'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getJson } from '../../lib/api';
import { getDemoCategoryDetail } from '../../lib/demo-data';

export default function CategoryDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const [data, setData] = useState<any>(null);
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    async function loadCategory() {
      try {
        setLoading(true);
        const query = city ? `?city=${encodeURIComponent(city)}` : '';
        const result = await getJson(`/categories/${params.slug}${query}`);
        if (isActive) {
          setData(result);
          setError('');
        }
      } catch (err) {
        if (isActive) {
          setData(getDemoCategoryDetail(params.slug, city));
          setError('');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadCategory();
    return () => {
      isActive = false;
    };
  }, [params.slug, city]);

  return (
    <main
      id="main-content"
      className="min-h-screen bg-slate-950 px-6 py-16 text-white"
    >
      <div className="mx-auto max-w-6xl">
        <Link
          href="/categories"
          className="text-sm font-medium text-amber-400 hover:text-amber-300"
        >
          Categories par wapas
        </Link>
        <p className="mt-8 text-sm uppercase tracking-[0.3em] text-amber-400">
          Apne sheher ke verified vendors
        </p>
        <h1 className="mt-2 text-4xl font-semibold">
          {data?.category?.name || 'Wedding category'}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-300">
          {data?.category?.description ||
            'Is category mein apni shaadi ke liye trusted vendors talash karein.'}
        </p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Filter by city or service area"
            className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2"
          />
        </div>

        {loading ? (
          <p className="mt-8 text-sm text-slate-400">Loading vendors...</p>
        ) : null}
        {error ? <p className="mt-8 text-sm text-rose-300">{error}</p> : null}

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {(data?.vendors || []).map((vendor: any) => (
            <Link
              key={vendor.id}
              href={`/vendors/${vendor.id}`}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-amber-400/50 hover:bg-white/10"
            >
              <h2 className="text-xl font-semibold">{vendor.businessName}</h2>
              <p className="mt-3 line-clamp-3 text-slate-300">
                {vendor.description ||
                  'Shaadi ke liye trusted service provider.'}
              </p>
              <p className="mt-5 text-sm text-slate-400">
                {vendor.city || vendor.serviceAreas?.[0] || 'Pakistan'} - PKR{' '}
                {Number(vendor.startingPrice || 0).toLocaleString()}
              </p>
            </Link>
          ))}
        </div>

        {!loading && (data?.vendors || []).length === 0 ? (
          <p className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300">
            Filhaal is category mein koi vendor nahi mila. Matching vendors ko
            notify kar diya gaya hai.
          </p>
        ) : null}
      </div>
    </main>
  );
}
