import { apiRequest } from './axios';

export const adminApi = {
  getStats: async (token: string) => {
    const res = await apiRequest('get', '/admin/stats', token);
    return res.data;
  },

  getPendingDesigners: async (token: string) => {
    const res = await apiRequest('get', '/admin/designers/pending', token);
    return res.data.designers;
  },

  approveDesigner: async (id: string, token: string) => {
    await apiRequest('patch', `/admin/designers/${id}/approve`, token);
  },

  rejectDesigner: async (id: string, reason: string, token: string) => {
    await apiRequest('patch', `/admin/designers/${id}/reject`, token, { reason });
  },
};