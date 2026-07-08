import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  // Set default auth header
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get('/api/auth/profile');
        setUser(res.data);
      } catch (err) {
        console.error('Session validation failed:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      
      // Check if 2FA is required
      if (res.data.twoFactorRequired) {
        return { twoFactorRequired: true, userId: res.data.userId };
      }

      const { token: receivedToken, user: loggedUser } = res.data;
      localStorage.setItem('token', receivedToken);
      setToken(receivedToken);
      setUser(loggedUser);
      return { success: true, user: loggedUser };
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Login failed.');
    }
  };

  const verify2FA = async (userId, code) => {
    try {
      const res = await axios.post('/api/auth/2fa/verify', { userId, code });
      const { token: receivedToken, user: loggedUser } = res.data;
      localStorage.setItem('token', receivedToken);
      setToken(receivedToken);
      setUser(loggedUser);
      return loggedUser;
    } catch (err) {
      throw new Error(err.response?.data?.error || '2FA Verification failed.');
    }
  };

  const register = async (name, email, password, role = 'developer') => {
    try {
      const res = await axios.post('/api/auth/register', { name, email, password, role });
      const { token: receivedToken, user: registeredUser } = res.data;
      localStorage.setItem('token', receivedToken);
      setToken(receivedToken);
      setUser(registeredUser);
      return registeredUser;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Registration failed.');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateProfile = async (name, email, password) => {
    try {
      const res = await axios.put('/api/auth/profile', { name, email, password });
      setUser(res.data);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to update profile.');
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    verify2FA,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
