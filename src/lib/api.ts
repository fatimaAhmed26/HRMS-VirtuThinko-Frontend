import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

// In development VITE_API_URL is empty and Vite forwards /api to the backend (vite.config.ts)
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // sends the httpOnly refresh-token cookie to /api/auth/*
});

// The access token lives only in memory (not localStorage), so scripts on the page can't steal it
// from storage. After a page reload it is restored with the refresh cookie (see AuthContext).
let accessToken: string | null = null;
let onSessionExpired: () => void = () => {};

export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function setSessionExpiredHandler(fn: () => void) {
  onSessionExpired = fn;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// When a request fails with 401 (token expired after 15 minutes), get a new token once
// and repeat the request. Several requests failing together share one refresh call.
let refreshing: Promise<string> | null = null;

export async function refreshAccessToken() {
  refreshing ??= axios
    .post<{ accessToken: string }>(`${api.defaults.baseURL}/auth/refresh`, null, { withCredentials: true })
    .then((r) => {
      setAccessToken(r.data.accessToken);
      return r.data.accessToken;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

type RetryConfig = InternalAxiosRequestConfig & { _retried?: boolean };

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;
    const isAuthCall = config?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && config && !config._retried && !isAuthCall) {
      config._retried = true;
      try {
        await refreshAccessToken();
        return api(config);
      } catch {
        setAccessToken(null);
        onSessionExpired();
      }
    }
    return Promise.reject(error);
  }
);

// Turns any API error into a readable sentence for the screen
export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.') {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; details?: { message?: string }[] } | undefined;
    if (data?.details?.[0]?.message) return `${data.message ?? 'Invalid input'}: ${data.details[0].message}`;
    if (data?.message) return data.message;
    if (!err.response) return 'Cannot reach the server. Is the backend running on port 5000?';
  }
  return fallback;
}

// Download a file (PDF, Excel, CSV) from a protected endpoint
export async function downloadFile(url: string, fallbackName: string) {
  const res = await api.get(url, { responseType: 'blob' });
  const disposition = String(res.headers['content-disposition'] ?? '');
  const name = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? fallbackName;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(res.data as Blob);
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}
