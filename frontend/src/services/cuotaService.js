import api from './api';

export const cuotaService = {
  getAll: (params = {}) => {
    return api.get('/cuotas/', { params });
  },
  
  getById: (id) => {
    return api.get(`/cuotas/${id}/`);
  },
  
  create: (cuotaData) => {
    return api.post('/cuotas/', cuotaData);
  },
  
  update: (id, cuotaData) => {
    return api.put(`/cuotas/${id}/`, cuotaData);
  },
  
  delete: (id) => {
    return api.delete(`/cuotas/${id}/`);
  }
};