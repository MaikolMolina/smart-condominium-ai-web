import api from './api';

export const roleService = {
  getAll: () => {
    return api.get('/roles/');
  },
  
  getById: (id) => {
    return api.get(`/roles/${id}/`);
  },
  
  create: (roleData) => {
    return api.post('/roles/', roleData);
  },
  
  update: (id, roleData) => {
    return api.put(`/roles/${id}/`, roleData);
  },
  
  delete: (id) => {
    return api.delete(`/roles/${id}/`);
  },
  
  getPrivileges: (roleId) => {
    return api.get(`/roles/${roleId}/privilegios/`);
  },
  
  assignPrivilege: (roleId, privilegeId) => {
    return api.post(`/roles/${roleId}/privilegios/`, { privilegio_id: privilegeId });
  },
  
  removePrivilege: (roleId, privilegeId) => {
    return api.delete(`/roles/${roleId}/privilegios/${privilegeId}/`);
  }
};