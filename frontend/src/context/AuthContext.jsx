import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProfile, login as loginApi, register as registerApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const profile = await getProfile();
          setUser(profile);
        } catch (error) {
          console.error('Failed to load user profile:', error);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const data = await loginApi(credentials);
      localStorage.setItem('token', data.token);
      setUser({
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        githubUsername: data.githubUsername,
      });
      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const data = await registerApi(userData);
      localStorage.setItem('token', data.token);
      setUser({
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        githubUsername: data.githubUsername,
      });
      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
