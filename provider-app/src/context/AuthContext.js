import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getToken, setToken, clearToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (token) {
          const profile = await api.profile();
          setProvider(profile);
        }
      } catch {
        await clearToken();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (token, profileData) => {
    await setToken(token);
    setProvider(profileData);
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    setProvider(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await api.profile();
      setProvider(profile);
    } catch {/* silent */}
  }, []);

  return (
    <AuthContext.Provider value={{ provider, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
