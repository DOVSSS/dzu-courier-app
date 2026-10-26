import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoSecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from '../constants/storageKeys';
import type { User, UserRole } from '../types/api.types';

// expo-secure-store не работает в браузере
const SecureStore = Platform.OS === 'web'
  ? {
      getItemAsync: (key: string) => AsyncStorage.getItem(`secure_${key}`),
      setItemAsync: (key: string, value: string) => AsyncStorage.setItem(`secure_${key}`, value),
      deleteItemAsync: (key: string) => AsyncStorage.removeItem(`secure_${key}`),
    }
  : ExpoSecureStore;

// Токены хранятся в памяти — синхронный доступ из interceptor'ов axios
let memoryToken: string | null = null;
let memoryRefreshToken: string | null = null;
let memoryUser: User | null = null;

// Сессии старых версий: id и роль есть только внутри JWT
function userFromToken(token: string): User | null {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { id, role } = JSON.parse(atob(payload)) as { id?: string; role?: UserRole };
    return id && role ? { id, role, email: '' } : null;
  } catch {
    return null;
  }
}

export const TokenManager = {
  // Вызывать при старте приложения
  async init(): Promise<void> {
    try {
      let token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) {
        // Старые версии хранили токен в AsyncStorage — переносим в SecureStore
        const legacyToken = await AsyncStorage.getItem(TOKEN_KEY);
        if (legacyToken) {
          await SecureStore.setItemAsync(TOKEN_KEY, legacyToken);
          await AsyncStorage.removeItem(TOKEN_KEY);
          token = legacyToken;
        }
      }
      const [refreshToken, userJson] = await Promise.all([
        SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);
      memoryToken = token;
      memoryRefreshToken = refreshToken;
      memoryUser = userJson ? JSON.parse(userJson) : token ? userFromToken(token) : null;
    } catch {
      memoryToken = null;
      memoryRefreshToken = null;
      memoryUser = null;
    }
  },

  getToken(): string | null {
    return memoryToken;
  },

  getRefreshToken(): string | null {
    return memoryRefreshToken;
  },

  getUser(): User | null {
    return memoryUser;
  },

  async setToken(token: string): Promise<void> {
    memoryToken = token;
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  async setRefreshToken(refreshToken: string): Promise<void> {
    memoryRefreshToken = refreshToken;
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  },

  async setUser(user: User): Promise<void> {
    memoryUser = user;
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  async clearToken(): Promise<void> {
    memoryToken = null;
    memoryRefreshToken = null;
    memoryUser = null;
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
  },
};
