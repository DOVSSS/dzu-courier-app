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
import api, { setUnauthorizedHandler } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function syncPushToken(userId: string): Promise<void> {
  try {
    const pushToken = await registerForPushNotifications();
    if (pushToken) {
      await api.patch(`/users/${userId}`, { pushToken });
    }
  } catch {
    // Уведомления не должны мешать входу
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await TokenManager.init();
        const savedToken = TokenManager.getToken();
        const savedUser = TokenManager.getUser();
        if (savedToken && savedUser?.role === 'COURIER') {
          setToken(savedToken);
          setUser(savedUser);
          // Push-токен мог смениться с прошлого запуска
          void syncPushToken(savedUser.id);
        } else if (savedToken) {
          await TokenManager.clearToken();
        }
      } catch {
        await TokenManager.clearToken();
        setToken(null);
        setUser(null);
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
    await TokenManager.setRefreshToken(data.refreshToken);
    await TokenManager.setUser(data.user);
    setToken(data.accessToken);
    setUser(data.user);

    void syncPushToken(data.user.id);
  };

  const login = async (email: string, password: string): Promise<void> => {
    const data = await loginRequest({ email: email.trim(), password });
    await applyAuthResponse(data);
  };

  const logout = async (): Promise<void> => {
    // Иначе уведомления о заказах продолжат приходить на это устройство
    if (user) {
      try {
        await api.patch(`/users/${user.id}`, { pushToken: null });
      } catch {
        // Выход должен сработать и без сети
      }
    }
    await TokenManager.clearToken();
    setToken(null);
    setUser(null);
  };

  const deleteAccount = async (): Promise<void> => {
    await api.delete('/users/me');
    await TokenManager.clearToken();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, deleteAccount }}>
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
