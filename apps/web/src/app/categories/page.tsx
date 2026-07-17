'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getJson } from '../lib/api';
import { demoCategories } from '../lib/demo-data';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await getJson('/categories');
        setCategories(Array.isArray(data) ? data : []);
      } catch {
        setCategories(demoCategories);
      } finally {
        setLoading(false);
      }
    }

    void loadCategories();
  }, []);

  return (
    <main
      id="main-content"
      className="min-h-screen bg-slate-950 px-6 py-16 text-white"
    >
      <div className="mx-auto max-w-6xl">
        <Link
          href="/vendors"
          className="text-sm font-medium text-amber-400 hover:text-amber-300"
        >
          Marketplace par wapas
        </Link>
        <p className="mt-8 text-sm uppercase tracking-[0.3em] text-amber-400">
          Har rasm, har service
        </p>
        <h1 className="mt-2 text-4xl font-semibold">
          Shaadi ki har zaroorat, ek jagah.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-300">
          Mehndi, Baraat, Walima ya ghar ki choti rasmein - sahi category se
          vendor talash karein.
        </p>

        {loading ? (
          <p className="mt-8 text-sm text-slate-400">Loading categories...</p>
        ) : null}

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-amber-400/50 hover:bg-white/10"
            >
              <h2 className="text-xl font-semibold">{category.name}</h2>
              <p className="mt-3 text-sm text-slate-400">
                {category.description ||
                  'Is rasm ke liye trusted services explore karein.'}
              </p>
              <p className="mt-5 text-sm text-amber-300">
                {category.vendorCount || 0} services listed
              </p>
            </Link>
          ))}
        </div>
        {!loading && categories.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300">
            Abhi categories load nahi hui. Thori dair baad dobara check karein.
          </p>
        ) : null}
      </div>
    </main>
  );
}
