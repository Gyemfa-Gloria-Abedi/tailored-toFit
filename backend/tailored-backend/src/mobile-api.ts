/**
 * Drop-in React Native API client.
 * Copy this file into the Expo project's src/api.ts or import it from a shared package.
 */
export type ApiConfig = { baseUrl: string; getToken?: () => Promise<string | null> | string | null };

export function createApi(config: ApiConfig) {
  async function request<T>(path: string, options: RequestInit = {}) {
    const token = await config.getToken?.();
    const response = await fetch(`${config.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message || `Request failed: ${response.status}`);
    }
    return response.status === 204 ? undefined as T : response.json() as Promise<T>;
  }

  return {
    health: () => request<{ ok: boolean }>('/health'),
    register: (body: { name: string; email: string; password: string; phone?: string; businessName?: string }) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: { email: string; password: string }) => request<{ token: string; user: any }>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    me: () => request('/api/auth/me'),
    dashboard: () => request('/api/dashboard'),
    clients: (search = '') => request(`/api/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    client: (id: string) => request(`/api/clients/${id}`),
    createClient: (body: any) => request('/api/clients', { method: 'POST', body: JSON.stringify(body) }),
    updateClient: (id: string, body: any) => request(`/api/clients/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    deleteClient: (id: string) => request<void>(`/api/clients/${id}`, { method: 'DELETE' }),
    measurements: (clientId: string) => request(`/api/clients/${clientId}/measurements`),
    saveMeasurement: (clientId: string, body: any) => request(`/api/clients/${clientId}/measurements`, { method: 'POST', body: JSON.stringify(body) }),
    generateFitProfile: (clientId: string) => request(`/api/clients/${clientId}/fit-profile/generate`, { method: 'POST' }),
    recommendations: (clientId: string) => request(`/api/clients/${clientId}/recommendations`),
    savedStyles: () => request('/api/styles'),
    saveStyle: (body: any) => request('/api/styles', { method: 'POST', body: JSON.stringify(body) }),
    deleteStyle: (id: string) => request<void>(`/api/styles/${id}`, { method: 'DELETE' }),
    profile: () => request('/api/profile'),
    updateProfile: (body: any) => request('/api/profile', { method: 'PATCH', body: JSON.stringify(body) })
  };
}
