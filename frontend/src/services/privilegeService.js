import api from './api';

export const privilegeService = {
  getAll: () => {
    return api.get('/privilegios/');
  },
  
  getById: (id) => {
    return api.get(`/privilegios/${id}/`);
  },
  
  create: (privilegeData) => {
    return api.post('/privilegios/', privilegeData);
  },
  
  update: (id, privilegeData) => {
    return api.put(`/privilegios/${id}/`, privilegeData);
  },
  
  delete: (id) => {
    return api.delete(`/privilegios/${id}/`);
  }
};