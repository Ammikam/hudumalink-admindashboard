import { apiRequest } from './axios';
import { ADMIN_ENDPOINTS } from './endpoints';

export const adminApi = {
  getStats: async (token: string) => {
    const res = await apiRequest('get', ADMIN_ENDPOINTS.stats, token);
    return res.data;
  },

  getPendingDesigners: async (token: string) => {
    const res = await apiRequest('get', ADMIN_ENDPOINTS.pendingDesigners, token);
    return res.data;
  },

  getAllDesigners: async (token: string, params?: { search?: string; status?: string; page?: number; limit?: number }) => {
    let url = ADMIN_ENDPOINTS.allDesigners;
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.search) searchParams.append('search', params.search);
      if (params.status) searchParams.append('status', params.status);
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      url += `?${searchParams.toString()}`;
    }
    const res = await apiRequest('get', url, token);
    return res.data;
  },

  getUsers: async (token: string, params?: { search?: string; page?: number; limit?: number }) => {
    let url = ADMIN_ENDPOINTS.users;
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.search) searchParams.append('search', params.search);
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      url += `?${searchParams.toString()}`;
    }
    const res = await apiRequest('get', url, token);
    return res.data;
  },

  getProjects: async (token: string, page = 1, limit = 15) => {
    const res = await apiRequest('get', `${ADMIN_ENDPOINTS.projects}?page=${page}&limit=${limit}`, token);
    return res.data;
  },

  approveDesigner: async (id: string, token: string) => {
    await apiRequest('patch', ADMIN_ENDPOINTS.approveDesigner(id), token);
  },

  rejectDesigner: async (id: string, reason: string, token: string) => {
    await apiRequest('patch', ADMIN_ENDPOINTS.rejectDesigner(id), token, { reason });
  },

 suspendDesigner: async (id: string, suspended: boolean, reason?: string, token?: string) => {
  if (!token) throw new Error('Authentication required');
  await apiRequest('patch', ADMIN_ENDPOINTS.suspendDesigner(id), token, { suspended, reason });
},

  verifyDesigner: async (id: string, verified: boolean, token: string) => {
    await apiRequest('patch', ADMIN_ENDPOINTS.verifyDesigner(id), token, { verified });
  },

  superVerifyDesigner: async (id: string, superVerified: boolean, token: string) => {
    await apiRequest('patch', ADMIN_ENDPOINTS.superVerifyDesigner(id), token, { superVerified });
  },

banUser: async (id: string, banned: boolean, reason?: string, token?: string) => {
  if (!token) throw new Error('Authentication required');
  await apiRequest('patch', ADMIN_ENDPOINTS.banUser(id), token, { banned, reason });
},

  deleteProject: async (id: string, token: string) => {
    await apiRequest('delete', ADMIN_ENDPOINTS.deleteProject(id), token);
  },
};