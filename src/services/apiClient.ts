export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

let csrfToken: string | null = null;

const readResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => ({})) as { error?: string } & T;
  if (!response.ok) throw new ApiError(data.error || `Request failed (${response.status})`, response.status);
  return data;
};

const getCsrfToken = async () => {
  const response = await fetch('/api/auth/csrf', { credentials: 'include' });
  const data = await readResponse<{ csrfToken: string }>(response);
  csrfToken = data.csrfToken;
  return csrfToken;
};

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const headers = new Headers(options.headers);
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (options.body && !isFormData && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) headers.set('x-csrf-token', await getCsrfToken());
  const response = await fetch(path, { ...options, method, headers, credentials: 'include' });
  if (response.status === 403 && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    csrfToken = null;
  }
  return readResponse<T>(response);
}

export const apiGet = <T>(path: string) => apiRequest<T>(path);
export const apiPost = <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });
export const apiPatch = <T>(path: string, body: unknown) => apiRequest<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
export const apiPut = <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body) });
export const apiDelete = <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' });

