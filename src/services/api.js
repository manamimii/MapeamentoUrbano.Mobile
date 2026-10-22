
import * as SecureStore from 'expo-secure-store';

export const API_BASE_URL =
  'https://api-lovat-tau-30.vercel.app//api';

// Replace these paths with your actual API routes.
export const AUTH_ENDPOINTS = {
  login: '/Login/login',
  register: '/User/Create',
};


export async function apiRequest(
  endpoint,
  { method = 'GET', body, authenticated = false } = {}
) {
  const headers = {
    Accept: 'application/json',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (authenticated) {
    const token = await SecureStore.getItemAsync('authToken');

    if (!token) {
      throw new Error('You must be logged in.');
    }

    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    console.log('API REQUEST:', method, url);

    const response = await fetch(url, {
      method,
      headers,
      body: body === undefined
        ? undefined
        : JSON.stringify(body),
    });

    const raw = await response.text();

    let data;

    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = raw;
    }

    console.log('API STATUS:', response.status);
    console.log('API RESPONSE:', data);

    const hasError =
      !response.ok ||
      (typeof data?.statusCode === 'number' &&
        data.statusCode >= 400) ||
      (typeof data?.status === 'number' &&
        data.status >= 400);

    if (hasError) {
      const errors = [];

      // ASP.NET Core ModelState validation
      if (data?.errors && typeof data.errors === 'object') {
        Object.entries(data.errors).forEach(([field, messages]) => {
          const values = Array.isArray(messages)
            ? messages
            : [messages];

          values.forEach(message => {
            errors.push(`${field}: ${message}`);
          });
        });
      }

      // Custom ResponseDTO validation
      if (Array.isArray(data?.validationErrors)) {
        errors.push(...data.validationErrors);
      }

      const message =
        errors.length > 0
          ? errors.join('\n')
          : data?.message ||
            data?.title ||
            `HTTP ${response.status}`;

      // Log without triggering Expo's error overlay
      console.log('API STATUS:', response.status);
      console.log('API VALIDATION ERRORS:', message);

      throw new Error(message);
    }

    return data;

  } catch (error) {
    console.log('API REQUEST FAILED:', error.message);
    throw error;
  }
}

