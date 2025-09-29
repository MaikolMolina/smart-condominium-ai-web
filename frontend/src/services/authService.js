import api from './api';

export const authService = {
  login: (credentials) => {
    return api.post('/auth/login/', credentials);
  },
  
  logout: () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      return api.post('/auth/logout/', { refresh_token: refreshToken });
    }
    return Promise.resolve();
  },
  
  getCurrentUser: () => {
    return api.get('/users/me/');
  }
};