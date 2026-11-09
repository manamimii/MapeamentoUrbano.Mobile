import { apiRequest } from './api';

export const profileService = {
  async getUserProfile() {
    const response = await apiRequest(
      '/User/GetUserProfile',
      {
        method: 'GET',
      }
    );

    return response?.entity ?? response;
  },

  async updateUser(userDTO) {
    const response = await apiRequest(
      '/User/Update',
      {
        method: 'PUT',
        body: userDTO,
      }
    );

    return response?.entity ?? response;
  },
};
