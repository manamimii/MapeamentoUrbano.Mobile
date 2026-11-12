import { apiRequest } from './api';

export const eventService = {
  async getPaginated(
    pageIndex = 1,
    pageSize = 10,
    sortOrder = ''
  ) {
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

    return response?.entity ?? response;
  },

  async revaluateEvent(eventId) {
    if (!eventId) {
      throw new Error('Id do evento não encontrado.');
    }

    const response = await apiRequest(
      `/Event/RevaluateEvent?eventId=${encodeURIComponent(eventId)}`,
      {
        method: 'PUT',
      }
    );

    if (response?.statusCode >= 400) {
      throw new Error(
        response.message ||
        response.validationErrors?.join('\n') ||
        'Não foi possível solicitar a reavaliação.'
      );
    }

    return response;
  },
};
