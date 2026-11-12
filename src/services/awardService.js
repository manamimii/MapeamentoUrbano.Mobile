import { apiRequest } from './api';

export const awardService = {
  async getProfileAwards(
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
      `/Award/GetProfileAwardsPaginated?${params.toString()}`,
      {
        method: 'GET',
      }
    );

    return response?.entity ?? response;
  },
};
