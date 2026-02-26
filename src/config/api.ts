/**
 * API configuration for production backend at pcstech.in
 * All requests use the live production API URL.
 * baseURL must NOT end with "/" so axios does not produce "//" in URLs.
 */
import axios, { AxiosInstance } from 'axios';

/** Production API URL – hardcoded to live server. No local override. */
export const BASE_URL = 'https://pcstech.in/catering/backend/index.php/api';

export const ENDPOINTS = {
  ping: '/ping',
  profile: '/profile',
  events: '/events',
  event: (id: number) => `/events/${id}`,
  trash: '/trash',
  grocery: (id: number) => `/events/${id}/grocery`,
  vegetable: (id: number) => `/events/${id}/vegetable`,
  customDesign: '/custom-design',
  customDesignUpload: '/custom-design/upload',
  footer: '/footer',
  suggestions: '/suggestions',
  suggestion: (id: number) => `/suggestions/${id}`,
  dishes: (eventId: number) => `/events/${eventId}/dishes`,
  dish: (eventId: number, dishId: number) => `/events/${eventId}/dishes/${dishId}`,
} as const;

/** Single Axios instance for all API requests. Do not create other instances. */
export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Network debug: log full URL, method before each request. Wrapped in try/catch so release builds never crash. */
apiClient.interceptors.request.use((config) => {
  try {
    const base = config?.baseURL ?? '';
    const path = config?.url ?? '';
    if (typeof console?.log === 'function') {
      console.log('[API Request]', { method: (config?.method ?? 'get').toUpperCase(), fullURL: String(base) + String(path) });
    }
  } catch (_) {}
  return config;
});

/** Enhanced error logging for debugging Network Error and API issues. Safe for production: no unsafe property access, no serializing complex objects (e.g. headers) that can crash Hermes/release. */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    try {
      const config = error?.config;
      const baseURL = config?.baseURL ?? '';
      const url = config?.url ?? '';
      const log: Record<string, unknown> = {
        message: error?.message ?? 'Unknown error',
        baseURL: baseURL || undefined,
        url: url || undefined,
      };
      if (error?.response) {
        const res = error.response;
        log.response = {
          status: res?.status,
          data: res?.data,
        };
      }
      if (error?.request) {
        log.request = {
          method: config?.method,
          fullURL: String(baseURL) + String(url),
        };
      }
      const str = JSON.stringify(log, null, 2);
      if (typeof console?.warn === 'function') console.warn('[API Error]', str);
    } catch (_) {
      // Never let the interceptor throw – production/release can crash the app
    }
    return Promise.reject(error);
  }
);
