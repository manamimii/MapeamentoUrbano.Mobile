import { apiRequest } from './api';

export const addressService = {
  async create(address) {
    return apiRequest('/Address/Create', {
      method: 'POST',
      body: {
        street: address.street.trim(),
        number: address.number.trim(),
        neighborhood: address.neighborhood.trim(),
        city: address.city.trim(),
        state: address.state.trim().toUpperCase(),
        zipCode: address.zipCode.replace(/\D/g, ''),
      },
    });
  },

  async getProfileAddress() {
    const response = await apiRequest(
      '/Address/GetProfileAddress',
      {
        method: 'GET',
      }
    );

    return response?.entity ?? response;
  },

  async update(address) {
    if (!address.id) {
      throw new Error('Id do endereço não encontrado.');
    }

    return apiRequest('/Address/Update', {
      method: 'PUT',
      body: {
        id: address.id,
        street: address.street.trim(),
        number: address.number.trim(),
        neighborhood: address.neighborhood.trim(),
        city: address.city.trim(),
        state: address.state.trim().toUpperCase(),
        zipCode: address.zipCode.replace(/\D/g, ''),
      },
    });
  },
};

