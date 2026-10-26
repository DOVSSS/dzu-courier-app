import axios from 'axios';
import { TokenManager } from './tokenManager';
import { API_URL } from '../constants/storageKeys';

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
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

// Один общий запрос на обновление, даже если 401 пришёл сразу нескольким запросам
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = TokenManager.getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token');
  }
  // Эндпоинт защищён @Auth(), поэтому нужен и старый (пусть просроченный) accessToken
  const response = await axios.post(
    `${API_URL}/api/auth/login/access-token`,
    { refreshToken },
    { headers: { Authorization: `Bearer ${TokenManager.getToken()}` }, timeout: 30000 },
  );
  const { accessToken, refreshToken: newRefreshToken } = response.data;
  await TokenManager.setToken(accessToken);
  await TokenManager.setRefreshToken(newRefreshToken);
  return accessToken;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const accessToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        await TokenManager.clearToken();
        onUnauthorized?.();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
