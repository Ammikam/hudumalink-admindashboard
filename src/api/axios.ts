
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

// Create a function to attach token for each request
export const attachToken = async () => {
  const { getToken } = useAuth();
  return await getToken({ template: 'standard' });
};

// Wrapper function to include token automatically
export const apiRequest = async (method: 'get' | 'post' | 'patch' | 'delete', url: string, data?: any) => {
  const token = await attachToken();

  return axios({
    method,
    url: `${API_URL}${url}`,
    data,
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
    },
  });
};
