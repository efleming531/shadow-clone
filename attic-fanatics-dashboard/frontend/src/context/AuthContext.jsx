import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('af_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('af_token');
    if (token) {
      api.get('/auth/me')
        .then(res => { setUser(res.data); localStorage.setItem('af_user', JSON.stringify(res.data)); })
        .catch(() => { localStorage.removeItem('af_token'); localStorage.removeItem('af_user'); setUser(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('af_token', res.data.token);
    localStorage.setItem('af_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('af_token');
    localStorage.removeItem('af_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updated) => {
    setUser(updated);
    localStorage.setItem('af_user', JSON.stringify(updated));
  }, []);

  const isOwner = user?.role === 'OWNER';
  const isManager = user?.role === 'MANAGER';
  const isRep = user?.role === 'REP';
  const canManageData = isOwner || isManager;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isOwner, isManager, isRep, canManageData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
