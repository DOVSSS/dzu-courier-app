import axios from 'axios';
import { TokenManager } from './tokenManager';

const api = axios.create({
  baseURL: 'https://delivery-backend-alichan25.msk1.amvera.tech/api',
});

api.interceptors.request.use(
  (config) => {
    const token = TokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      TokenManager.clearToken();
    }
    return Promise.reject(error);
  }
);

export default api;