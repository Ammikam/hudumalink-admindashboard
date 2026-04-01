import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL + '/api';

export const apiRequest = async (
  method: 'get' | 'post' | 'patch' | 'delete',
  url: string,
  token: string,
  data?: any
) => {
  return axios({
    method,
    url: `${API_URL}${url}`,
    data,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
};