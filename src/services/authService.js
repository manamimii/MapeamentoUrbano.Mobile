import * as SecureStore from 'expo-secure-store';
import {
  apiRequest,
  AUTH_ENDPOINTS,
} from './api';

export const authService = {
  
async login(email, password) {
  const response = await apiRequest(
    AUTH_ENDPOINTS.login,
    {
      method: 'POST',
      body: {
        email,
        password,
      },
    }
  );

  // Your API returns the JWT directly in entity.
  const token =
    typeof response?.entity === 'string'
      ? response.entity
      : response?.entity?.token ?? response?.token;

  if (typeof token !== 'string' || !token.trim()) {
    throw new Error(
      'Login response did not contain an authentication token.'
    );
  }

  // Store JWT securely on the device.
  await SecureStore.setItemAsync('authToken', token);

  console.log('LOGIN SUCCESSFUL');

  return {
    token,
    user: { email },
  };
},


  async register(name, email, password) {
    return apiRequest(AUTH_ENDPOINTS.register, {
      method: 'POST',
      body: {
        userName: name,
        userEmail: email,
        userPassword: password,
      },
    });
  },

  async getToken() {
    return SecureStore.getItemAsync('authToken');
  },

  async logout() {
    await SecureStore.deleteItemAsync('authToken');
  },
};
