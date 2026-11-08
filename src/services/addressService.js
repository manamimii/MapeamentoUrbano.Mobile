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
};