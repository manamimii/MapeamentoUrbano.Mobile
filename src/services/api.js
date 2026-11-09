
import { tokenService } from './tokenService';
import { api } from './apiUrl';

export const AUTH_ENDPOINTS = {
  login: '/Login/login',
  register: '/User/Create',
};

export const ADDRESS_ENDPOINTS = {
  create: '/Address/Create',
};

export async function apiRequest(
  endpoint,
  {
    method = 'GET',
    body,
    public: isPublic = false,
  } = {}
) {
  const url = `${api}${endpoint}`;

  const headers = {
    Accept: 'application/json',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (!isPublic) {
    const token = await tokenService.get();

    if (!token) {
      console.log('API AUTH ERROR:', {
        endpoint,
        message: 'Token não encontrado',
      });

      throw new Error(
        'Sessão não encontrada. Faça login novamente.'
      );
    }

    headers.Authorization = `Bearer ${token}`;
  }

  try {
    console.log('API REQUEST:', method, endpoint);
    console.log('API URL:', url);

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

    console.log('API RESPONSE:', {
      endpoint,
      httpStatus: response.status,
      statusCode,
      data,
    });

    const hasError =
      !response.ok ||
      statusCode >= 400 ||
      data?.success === false;

    if (hasError) {
      const errors = [];

      if (
        data?.errors &&
        typeof data.errors === 'object'
      ) {
        Object.entries(data.errors).forEach(
          ([field, messages]) => {
            const values = Array.isArray(messages)
              ? messages
              : [messages];

            values.forEach((message) => {
              errors.push(`${field}: ${message}`);
            });
          }
        );
      }

      if (Array.isArray(data?.validationErrors)) {
        errors.push(...data.validationErrors);
      }

      const message =
        errors.length > 0
          ? errors.join('\n')
          : data?.message ||
            data?.title ||
            (typeof data === 'string' ? data : null) ||
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

export const addressService = {
  create: async (address) => {
    return apiRequest(ADDRESS_ENDPOINTS.create, {
      method: 'POST',
      body: address,
    });
  },
};
