import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('lpdr_token');
    const savedUser = localStorage.getItem('lpdr_user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('lpdr_token');
        localStorage.removeItem('lpdr_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await authApi.login(email, password);
    const { token, user: userData } = response.data;
    
    localStorage.setItem('lpdr_token', token);
    localStorage.setItem('lpdr_user', JSON.stringify(userData));
    setUser(userData);
    
    return userData;
  }, []);

  const register = useCallback(async (data) => {
    const response = await authApi.register(data);
    const { token, user: userData } = response.data;
    
    localStorage.setItem('lpdr_token', token);
    localStorage.setItem('lpdr_user', JSON.stringify(userData));
    setUser(userData);
    
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('lpdr_token');
    localStorage.removeItem('lpdr_user');
    setUser(null);
    window.location.href = '/';
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.getMe();
      const { user: userData } = response.data;
      localStorage.setItem('lpdr_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch {
      logout();
    }
  }, [logout]);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      isAuthenticated: !!user,
      isPetOwner: user?.role === 'pet_owner',
      isDronePilot: user?.role === 'drone_pilot',
      isAdmin: user?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
