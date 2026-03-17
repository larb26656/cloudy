// api/client.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || window.origin + '/api';

export class ApiError extends Error {
  code: string;
  status?: number;

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(
      error.message || error.error || `HTTP ${response.status}`,
      error.code || 'HTTP_ERROR',
      response.status
    );
  }
  return response.json();
}

export const api = {
  get: async <T>(path: string, params?: Record<string, unknown>): Promise<T> => {
    const url = new URL(`${API_BASE_URL}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    const response = await fetch(url.toString());
    return handleResponse<T>(response);
  },

  post: async <T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  patch: async <T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  delete: async <T>(path: string): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
    });
    return handleResponse<T>(response);
  },
};

export function createEventSource(directory: string): EventSource {
  return new EventSource(`${API_BASE_URL}/event?directory=${encodeURIComponent(directory)}`);
}

export { API_BASE_URL };
