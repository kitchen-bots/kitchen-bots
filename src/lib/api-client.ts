import { auth } from './firebase';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export interface ApiRequestOptions extends RequestInit {
  requireAuth?: boolean;
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Clean API client wrapper over fetch for Cloudflare Worker API.
 * Automatically injects Firebase ID token when required or available.
 * Handles non-2xx responses consistently without exposing sensitive tokens.
 */
export async function apiClient<T = unknown>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { requireAuth = false, params, headers: customHeaders, ...fetchConfig } = options;

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let fullUrl = `${API_BASE_URL}${cleanEndpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      fullUrl += `?${queryString}`;
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  const currentUser = auth.currentUser;
  if (currentUser) {
    const token = await currentUser.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  } else if (requireAuth) {
    throw new ApiError('Authentication required', 401);
  }

  let response: Response;
  try {
    response = await fetch(fullUrl, {
      ...fetchConfig,
      headers,
    });
  } catch (error) {
    throw new ApiError(
      error instanceof Error ? error.message : 'Network request failed',
      0
    );
  }

  let responseData: unknown;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }
  } else {
    responseData = await response.text();
  }

  if (!response.ok) {
    const message =
      typeof responseData === 'object' && responseData !== null && 'message' in responseData
        ? String((responseData as { message: unknown }).message)
        : `API request failed with status ${response.status}`;

    throw new ApiError(message, response.status, responseData);
  }

  return responseData as T;
}
