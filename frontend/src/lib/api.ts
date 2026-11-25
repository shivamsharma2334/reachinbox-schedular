const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export function getToken() {
  return localStorage.getItem('reachinbox_token') || '';
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${response.status})`);
  }

  return response.json();
}

export function googleLogin() {
  window.location.href = `${BASE}/auth/google`;
}
