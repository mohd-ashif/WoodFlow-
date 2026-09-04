const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  code?: string;
  status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data.message || 'An unexpected error occurred',
      response.status,
      data.code
    );
  }

  if (data.pagination !== undefined) {
    return {
      success: data.success,
      data: data.data,
      pagination: data.pagination,
    } as unknown as T;
  }

  return data.data !== undefined ? data.data : data;
}

export const api = {
  get: async (endpoint: string) => {
    const data = await fetchApi<any>(endpoint, { method: 'GET' });
    return { data: { success: true, data } };
  },
  post: async (endpoint: string, body?: any) => {
    const data = await fetchApi<any>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body || {}),
    });
    return { data: { success: true, data } };
  },
  put: async (endpoint: string, body?: any) => {
    const data = await fetchApi<any>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body || {}),
    });
    return { data: { success: true, data } };
  },
  patch: async (endpoint: string, body?: any) => {
    const data = await fetchApi<any>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body || {}),
    });
    return { data: { success: true, data } };
  },
  delete: async (endpoint: string) => {
    const data = await fetchApi<any>(endpoint, { method: 'DELETE' });
    return { data: { success: true, data } };
  },
};
