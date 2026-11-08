
import { tokenService } from './tokenService';

export const API_BASE_URL =
  'https://api-lovat-tau-30.vercel.app/api';

export const AUTH_ENDPOINTS = {
  login: '/Login/login',
  register: '/User/Create',
};

export async function apiRequest(
  endpoint,
  {
    method = 'GET',
    body,
    public: isPublic = false,
  } = {}
) {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = {
    Accept: 'application/json',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  // Automatically attach JWT to protected requests.
  if (!isPublic) {
    const token = await tokenService.get();

    if (!token) {
      throw new Error(
        'Sessão não encontrada. Faça login novamente.'
      );
    }

    headers.Authorization = `Bearer ${token}`;
  }

  try {
    console.log('API REQUEST:', method, endpoint);

    const response = await fetch(url, {
      method,
      headers,
      body:
        body === undefined
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

    const statusCode =
      typeof data?.statusCode === 'number'
        ? data.statusCode
        : response.status;

    const hasError =
      !response.ok || statusCode >= 400;

    if (hasError) {
      const errors = [];

      // ASP.NET Core validation errors.
      if (data?.errors && typeof data.errors === 'object') {
        Object.entries(data.errors).forEach(
          ([field, messages]) => {
            const values = Array.isArray(messages)
              ? messages
              : [messages];

            values.forEach(message => {
              errors.push(`${field}: ${message}`);
            });
          }
        );
      }

      // Custom ResponseDTO validation errors.
      if (Array.isArray(data?.validationErrors)) {
        errors.push(...data.validationErrors);
      }

      const message =
        errors.length > 0
          ? errors.join('\n')
          : data?.message ||
            data?.title ||
            `HTTP ${response.status}`;

      console.log('API ERROR:', {
        endpoint,
        statusCode,
        message,
      });

      throw new Error(message);
    }

    console.log('API SUCCESS:', {
      endpoint,
      statusCode,
    });

    return data;

  } catch (error) {
    console.log('API REQUEST FAILED:', {
      endpoint,
      message: error.message,
    });

    throw error;
  }
}
