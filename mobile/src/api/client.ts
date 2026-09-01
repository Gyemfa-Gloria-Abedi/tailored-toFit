import { getToken } from '../storage/token';

const API_URL = 'http://localhost:4000';

type ApiRequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  // Use an explicitly supplied token first.
  // Otherwise retrieve the saved login token.
  const token = options.token || (await getToken());

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let requestBody: BodyInit | undefined;

  if (options.body !== undefined) {
    if (
      typeof options.body === 'string' ||
      options.body instanceof FormData
    ) {
      requestBody = options.body as BodyInit;
    } else {
      requestBody = JSON.stringify(options.body);
    }
  }

  console.log('API REQUEST:', {
    path,
    method: options.method || 'GET',
    hasToken: !!token,
  });

  const response = await fetch(
    `${API_URL}${path}`,
    {
      method: options.method || 'GET',
      headers,
      body: requestBody,
    }
  );

  const contentType =
    response.headers.get('content-type') || '';

  let data: any;

  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data ||
        `Request failed with status ${response.status}`
    );
  }

  return data as T;
}