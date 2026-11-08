import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'authToken';

export const tokenService = {
  async get() {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },

  async save(token) {
    if (typeof token !== 'string' || !token.trim()) {
      throw new Error('Token inválido.');
    }

    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  async remove() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};
