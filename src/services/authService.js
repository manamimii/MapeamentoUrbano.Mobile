
import { jwtDecode } from 'jwt-decode';

import {
  apiRequest,
  AUTH_ENDPOINTS,
} from './api';

import { tokenService } from './tokenService';

export function getTokenData(token) {
  try {
    const decoded = jwtDecode(token);

    const firstAccess =
      String(decoded.FirstAccess ?? '').toLowerCase() === 'true';

    return {
      id: decoded.Id,
      userName: decoded.UserName,
      role: decoded.role,
      firstAccess,
    };
  } catch {
    throw new Error('Token de autenticação inválido.');
  }
}

export const authService = {
  async login(email, password) {
    const response = await apiRequest(
      AUTH_ENDPOINTS.login,
      {
        method: 'POST',
        public: true,
        body: {
          email: email.trim(),
          password,
        },
      }
    );

    // JWT is returned directly in ResponseDTO.Entity.
    const token = response?.entity;

    if (typeof token !== 'string' || !token.trim()) {
      throw new Error(
        'A API não retornou um token de autenticação.'
      );
    }

    const user = getTokenData(token);

    await tokenService.save(token);

    return {
      token,
      user,
    };
  },

  async register(name, email, password) {
    return apiRequest(AUTH_ENDPOINTS.register, {
      method: 'POST',
      public: true,
      body: {
        userName: name.trim(),
        userEmail: email.trim(),
        userPassword: password,
      },
    });
  },

  async getToken() {
    return tokenService.get();
  },

  async updateToken(newToken) {
    const user = getTokenData(newToken);

    await tokenService.save(newToken);

    return {
      token: newToken,
      user,
    };
  },

  async logout() {
    await tokenService.remove();
  },
};
