const DEFAULT_API_URL = 'http://localhost:3001/api';

const configuredApiUrl = (
  process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL
).replace(/\/+$/, '');
const DEFAULT_TIMEOUT_MS = 20_000;
let refreshPromise: Promise<boolean> | null = null;

export const API_ROOT = configuredApiUrl.endsWith('/api')
  ? configuredApiUrl
  : `${configuredApiUrl}/api`;

type JsonBody = unknown;

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function getStoredToken(key: 'accessToken' | 'refreshToken') {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(key);
}

function getAuthToken() {
  return getStoredToken('accessToken');
}

function getRefreshToken() {
  return getStoredToken('refreshToken');
}

export function saveToken(token: string) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('accessToken', token);
  }
}

export function saveAuthTokens(accessToken: string, refreshToken?: string) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      window.localStorage.setItem('refreshToken', refreshToken);
    }
  }
}

export function clearAuthTokens() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('accessToken');
    window.localStorage.removeItem('refreshToken');
  }
}

function buildUrl(
  path: string,
  query?: Record<string, string | number | boolean | null | undefined>,
) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${API_ROOT}${normalizedPath}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

function createTimeoutSignal(timeoutMs: number, signal?: AbortSignal | null) {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => {
    controller.abort(new Error(`Request timed out after ${timeoutMs}ms`));
  }, timeoutMs);

  function abortFromCaller() {
    controller.abort(signal?.reason);
  }

  if (signal) {
    if (signal.aborted) {
      abortFromCaller();
    } else {
      signal.addEventListener('abort', abortFromCaller, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      globalThis.clearTimeout(timeoutId);
      signal?.removeEventListener('abort', abortFromCaller);
    },
  };
}

function readErrorMessage(data: unknown, fallback: string) {
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const message = record.message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
    if (typeof record.error === 'string' && record.error.trim()) {
      return record.error;
    }
  }

  return fallback;
}

async function parseResponse(response: Response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json().catch(() => null);
  }

  const text = await response.text().catch(() => '');
  return text || null;
}

async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  refreshPromise = (async () => {
    const response = await fetch(buildUrl('/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => null);

    if (!response?.ok) {
      clearAuthTokens();
      return false;
    }

    const data = await parseResponse(response);
    const record = data as Record<string, string | undefined>;
    if (!record?.accessToken) {
      clearAuthTokens();
      return false;
    }

    saveAuthTokens(record.accessToken, record.refreshToken);
    return true;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

async function requestJson<T = any>(
  path: string,
  init: RequestInit = {},
  retryOnUnauthorized = true,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(init.headers || {});
  const isFormData =
    typeof FormData !== 'undefined' && init.body instanceof FormData;

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (init.body && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  const { signal, cleanup } = createTimeoutSignal(timeoutMs, init.signal);
  try {
    response = await fetch(buildUrl(path), {
      ...init,
      credentials: 'include',
      headers,
      signal,
    });
  } catch (error) {
    throw new ApiError(
      error instanceof DOMException && error.name === 'AbortError'
        ? `Request timed out while contacting the RasmBazaar API at ${API_ROOT}`
        : `Network error: could not reach the RasmBazaar API at ${API_ROOT}`,
      0,
      error,
    );
  } finally {
    cleanup();
  }

  if (
    response.status === 401 &&
    retryOnUnauthorized &&
    !path.startsWith('/auth/')
  ) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return requestJson<T>(path, init, false);
    }
  }

  const data = await parseResponse(response);
  if (!response.ok) {
    throw new ApiError(
      readErrorMessage(data, `Request failed with status ${response.status}`),
      response.status,
      data,
    );
  }

  if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
    return (data as { data: T }).data;
  }

  return data as T;
}

export async function getJson<T = any>(
  path: string,
  query?: Record<string, string | number | boolean | null | undefined>,
  options: { signal?: AbortSignal; timeoutMs?: number } = {},
) {
  const fullPath = query ? buildUrl(path, query).replace(API_ROOT, '') : path;
  return requestJson<T>(
    fullPath,
    { method: 'GET', signal: options.signal },
    true,
    options.timeoutMs,
  );
}

export async function postJson<T = any>(path: string, body?: JsonBody) {
  return requestJson<T>(path, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function postForm<T = any>(path: string, body: FormData) {
  return requestJson<T>(path, {
    method: 'POST',
    body,
  });
}

export async function patchJson<T = any>(path: string, body?: JsonBody) {
  return requestJson<T>(path, {
    method: 'PATCH',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function putJson<T = any>(path: string, body?: JsonBody) {
  return requestJson<T>(path, {
    method: 'PUT',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function deleteJson<T = any>(path: string) {
  return requestJson<T>(path, { method: 'DELETE' });
}

export const api = {
  get: getJson,
  post: postJson,
  patch: patchJson,
  put: putJson,
  delete: deleteJson,
  postForm,
};
