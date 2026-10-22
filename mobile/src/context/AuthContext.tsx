import React, { createContext, useContext, useEffect, useState } from 'react';
import { getToken, setToken, clearToken, api } from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = { id: number; phone: string } | null;

type AuthContextType = {
  user: User;
  token: string | null;
  loading: boolean;
  login: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  requestOtp: (phone: string) => Promise<string>;
};

const AuthContext = createContext<AuthContextType>({} as any);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const t = await getToken();
      const phone = await AsyncStorage.getItem('phone');
      const id = await AsyncStorage.getItem('userId');
      if (t && phone && id) {
        setTokenState(t);
        setUser({ id: Number(id), phone });
      }
      setLoading(false);
    })();
  }, []);

  const requestOtp = async (phone: string) => {
    const res: any = await api.requestOtp(phone);
    return res.devOtp || res.message;
  };

  const login = async (phone: string, otp: string) => {
    const res: any = await api.verifyOtp(phone, otp);
    await setToken(res.token);
    await AsyncStorage.setItem('phone', res.user.phone);
    await AsyncStorage.setItem('userId', String(res.user.id));
    setTokenState(res.token);
    setUser(res.user);
  };

  const logout = async () => {
    await clearToken();
    await AsyncStorage.removeItem('phone');
    await AsyncStorage.removeItem('userId');
    setTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, requestOtp }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
