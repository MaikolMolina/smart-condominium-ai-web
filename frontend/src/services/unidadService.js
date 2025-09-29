import api from './api';

export const unidadService = {
  getAll: () => {
    return api.get('/unidades/');
  },
  
  getById: (id) => {
    return api.get(`/unidades/${id}/`);
  },
  
  create: (unidadData) => {
    return api.post('/unidades/', unidadData);
  },
  
  update: (id, unidadData) => {
    return api.put(`/unidades/${id}/`, unidadData);
  },
  
  delete: (id) => {
    return api.delete(`/unidades/${id}/`);
  }
};