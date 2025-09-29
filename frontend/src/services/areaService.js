// src/services/areaService.js
import api from "./api";

const AreaService = {
  list: () => api.get("/areas/"),
  get: (id) => api.get(`/areas/${id}/`),
  create: (payload) => api.post("/areas/", payload),
  update: (id, payload) => api.put(`/areas/${id}/`, payload),
  remove: (id) => api.delete(`/areas/${id}/`),
  // Reglas para despues
  // listRules: () => api.get("/reglas-area/"),
};

export default AreaService;
