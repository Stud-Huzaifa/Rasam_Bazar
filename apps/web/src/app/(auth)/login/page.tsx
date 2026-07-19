'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { postJson, saveAuthTokens } from '../../lib/api';

function redirectForRoles(roles: string[] = []) {
  if (roles.includes('ADMIN') || roles.includes('SUPPORT_OFFICER')) {
    return '/admin';
  }

  if (roles.includes('VENDOR_OWNER') || roles.includes('VENDOR_STAFF')) {
    return '/vendor/dashboard';
  }

  return '/customer/weddings';
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const data = await postJson('/auth/login', { email, password });
      saveAuthTokens(data.accessToken, data.refreshToken);
      setMessage(`Signed in as ${data.user?.email || 'user'}`);
      router.push(redirectForRoles(data.user?.roles));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Login failed');
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
          Wapas Khush Aamdeed
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Apni shaadi ki planning wahi se continue karein.
        </p>
        <div className="mt-6 space-y-4">
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
        </div>
        <button
          disabled={isSubmitting}
          className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Signing in...' : 'Agla Step'}
        </button>
        {message ? (
          <p className="mt-4 text-sm text-slate-600">{message}</p>
        ) : null}
      </form>
    </main>
  );
}
