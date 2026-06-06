import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'forge_token';
const LEGACY_KEY = 'af_token';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('af_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Migrate legacy token to new key
    const legacyToken = localStorage.getItem(LEGACY_KEY);
    if (legacyToken && !localStorage.getItem(TOKEN_KEY)) {
      localStorage.setItem(TOKEN_KEY, legacyToken);
    }

    const token = localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_KEY);
    if (token) {
      api.get('/auth/me')
        .then(res => { setUser(res.data); localStorage.setItem('af_user', JSON.stringify(res.data)); })
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(LEGACY_KEY);
          localStorage.removeItem('af_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem(TOKEN_KEY, res.data.token);
    // Also set legacy key for backward compat with api.js interceptor
    localStorage.setItem(LEGACY_KEY, res.data.token);
    localStorage.setItem('af_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEGACY_KEY);
    localStorage.removeItem('af_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updated) => {
    setUser(updated);
    localStorage.setItem('af_user', JSON.stringify(updated));
  }, []);

  const customerLogin = useCallback(async (portalToken) => {
    const res = await api.post('/auth/customer-login', { portalToken });
    const { token, customer } = res.data;
    localStorage.setItem(TOKEN_KEY, token);
    return { token, customer };
  }, []);

  const isRole = useCallback((...roles) => user && roles.includes(user.role), [user]);

  const isOwner = user?.role === 'OWNER' || user?.role === 'admin';
  const isManager = user?.role === 'MANAGER';
  const isRep = user?.role === 'REP';
  const canManageData = isOwner || isManager;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, customerLogin, isRole, isOwner, isManager, isRep, canManageData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
