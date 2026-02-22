import * as SecureStore from 'expo-secure-store';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://guauai.ainertia.io';
const TOKEN_KEY = 'guauai_token';

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}
export async function setToken(t: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, t);
}
export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

async function authHeaders() {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { ...(await authHeaders()), ...(opts.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error de servidor');
  return data;
}

// ── AUTH ──────────────────────────────────────────────────────────
export const auth = {
  login:    (email: string, password: string) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email: string, password: string, name: string) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) }),
  me:       () => request('/api/auth/me'),
};

// ── DOGS ──────────────────────────────────────────────────────────
export const dogsApi = {
  list:    () => request('/api/dogs'),
  create:  (body: object) => request('/api/dogs', { method: 'POST', body: JSON.stringify(body) }),
  update:  (id: string, body: object) => request(`/api/dogs/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete:  (id: string) => request(`/api/dogs/${id}`, { method: 'DELETE' }),
  history: (id: string, limit = 50) => request(`/api/dogs/${id}/history?limit=${limit}`),
  stats:   (id: string) => request(`/api/dogs/${id}/stats`),
};

// ── AUDIO ─────────────────────────────────────────────────────────
export async function analyzeAudio(
  audioBase64: string,
  mimeType: string,
  dogName: string,
  dogBreed: string,
  dogId?: string,
  lang = 'es'
) {
  return request('/api/audio/analyze-base64', {
    method: 'POST',
    body: JSON.stringify({ audio_base64: audioBase64, mime_type: mimeType, dog_name: dogName, dog_breed: dogBreed, dog_id: dogId, lang }),
  });
}

// ── ALERTS ───────────────────────────────────────────────────────
export const alertsApi = {
  list: () => request('/api/alerts'),
};
