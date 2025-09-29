import api from './api';

export const invitadoService = {
  getAll: (params = {}) => {
    return api.get('/invitados/', { params });
  },
  
  getById: (id) => {
    return api.get(`/invitados/${id}/`);
  },
  
  create: (invitadoData) => {
    return api.post('/invitados/', invitadoData);
  },
  
  update: (id, invitadoData) => {
    return api.put(`/invitados/${id}/`, invitadoData);
  },
  
  delete: (id) => {
    return api.delete(`/invitados/${id}/`);
  },
  
  aprobar: (id) => {
    return api.post(`/invitados/${id}/aprobar/`);
  },
  
  rechazar: (id, observaciones) => {
    return api.post(`/invitados/${id}/rechazar/`, { observaciones });
  }
};