'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { postJson, saveAuthTokens } from '../../lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountType, setAccountType] = useState<'customer' | 'vendor'>(
    'customer',
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const payload =
        accountType === 'customer'
          ? { email, password, fullName, city }
          : {
              email,
              password,
              ownerName: fullName,
              businessName: `${fullName} Studio`,
              city,
            };

      const data = await postJson(`/auth/register/${accountType}`, payload);
      saveAuthTokens(data.accessToken, data.refreshToken);
      setMessage(`Account created for ${data.user?.email || email}`);
      router.push(
        accountType === 'vendor' ? '/marketplace' : '/customer/weddings',
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Registration failed',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6 py-16"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-2xl font-semibold text-slate-900">
          Apni Shaadi Banayein
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Planning shuru karein, ya apna wedding business list karein.
        </p>
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => setAccountType('customer')}
            className={`w-full rounded-lg border px-4 py-2 text-left text-sm font-medium ${accountType === 'customer' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 text-slate-700'}`}
          >
            Customer account
          </button>
          <button
            type="button"
            onClick={() => setAccountType('vendor')}
            className={`w-full rounded-lg border px-4 py-2 text-left text-sm font-medium ${accountType === 'vendor' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 text-slate-700'}`}
          >
            Vendor account
          </button>
        </div>
        <div className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Full name
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              type="email"
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              type="password"
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            City
            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              required
            />
          </label>
        </div>
        <button
          disabled={isSubmitting}
          className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting
            ? 'Creating account...'
            : accountType === 'vendor'
              ? 'Business List Karein'
              : 'Planning Shuru Karein'}
        </button>
        {message ? (
          <p className="mt-4 text-sm text-slate-600">{message}</p>
        ) : null}
      </form>
    </main>
  );
}
