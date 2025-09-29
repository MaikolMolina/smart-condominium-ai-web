import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userPrivileges, setUserPrivileges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      authService.getCurrentUser()
        .then(response => {
          setCurrentUser(response.data);
          // Extraer todos los privilegios de los roles del usuario
          const privileges = [];
          if (response.data.roles) {
            response.data.roles.forEach(role => {
              if (role.privilegios) {
                role.privilegios.forEach(privilege => {
                  if (!privileges.includes(privilege.codigo)) {
                    privileges.push(privilege.codigo);
                  }
                });
              }
            });
          }
          setUserPrivileges(privileges);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error getting current user:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      const { access, refresh, user } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      setCurrentUser(user);
      
      // Extraer privilegios del usuario
      const privileges = [];
      if (user.roles) {
        user.roles.forEach(role => {
          if (role.privilegios) {
            role.privilegios.forEach(privilege => {
              if (!privileges.includes(privilege.codigo)) {
                privileges.push(privilege.codigo);
              }
            });
          }
        });
      }
      setUserPrivileges(privileges);
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setCurrentUser(null);
      setUserPrivileges([]);
    }
  };

  const value = {
    currentUser,
    userPrivileges,
    login,
    logout,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};