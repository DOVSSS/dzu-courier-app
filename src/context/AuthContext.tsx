import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import type { User, AuthResponse } from '../types/api.types';
import { loginRequest } from '../services/authService';
import { TokenManager } from '../services/tokenManager';
import { registerForPushNotifications } from '../utils/notifications';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await TokenManager.init();
        const savedToken = TokenManager.getToken();
        if (savedToken) {
          setToken(savedToken);
        }
      } catch (error) {
        await TokenManager.clearToken();
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const applyAuthResponse = async (data: AuthResponse): Promise<void> => {
    if (data.user.role !== 'COURIER') {
      throw new Error('Доступ только для курьеров');
    }
    await TokenManager.setToken(data.accessToken);
    setToken(data.accessToken);
    setUser(data.user);

    // Сохраняем push-токен
    const pushToken = await registerForPushNotifications();
    if (pushToken) {
      try {
        await api.patch(`/users/${data.user.id}`, { pushToken });
      } catch (e) {
        console.log('Push token save failed:', e);
      }
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    const data = await loginRequest({ email, password });
    await applyAuthResponse(data);
  };

  const logout = async (): Promise<void> => {
    await TokenManager.clearToken();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};