import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getToken, setToken, clearToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true); // checking stored token on startup

  // On mount: check if a stored token exists and load profile
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (token) {
          const profile = await api.profile();
          setPatient(profile);
        }
      } catch {
        await clearToken(); // token invalid or expired
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (token, profileData) => {
    await setToken(token);
    setPatient(profileData);
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    setPatient(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await api.profile();
      setPatient(profile);
    } catch {/* silent */}
  }, []);

  return (
    <AuthContext.Provider value={{ patient, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
