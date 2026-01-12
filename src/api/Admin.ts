import { apiRequest } from './axios';

export const adminApi = {
  getStats: async () => {
    const res = await apiRequest('get', '/admin/stats');
    return res.data;
  },

  getPendingDesigners: async () => {
    const res = await apiRequest('get', '/admin/designers/pending');
    return res.data.designers;
  },

  approveDesigner: async (id: string) => {
    await apiRequest('patch', `/admin/designers/${id}/approve`);
  },

  rejectDesigner: async (id: string, reason: string) => {
    await apiRequest('patch', `/admin/designers/${id}/reject`, { reason });
  },

  banDesigner: async (id: string, banned: boolean, reason: string) => {
    await apiRequest('patch', `/admin/designers/${id}/ban`, { banned, reason });
  },
};
