import { apiRequest } from './api';

export const eventService = {
  async getPaginated(pageIndex = 1, pageSize = 10, sortOrder = '') {
    const params = new URLSearchParams({
      pageIndex: String(pageIndex),
      pageSize: String(pageSize),
    });

    if (sortOrder) {
      params.append('sortOrder', sortOrder);
    }

    const response = await apiRequest(
      `/Event/Paginated?${params.toString()}`,
      {
        method: 'GET',
      }
    );

    // Compatível com resposta direta ou ResponseDTO.
    return response?.entity ?? response;
  },
};
