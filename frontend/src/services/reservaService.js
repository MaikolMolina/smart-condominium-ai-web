// src/services/reservaService.js
import api from "./api";

const ReservaService = {
  list: (params = {}) => api.get("/reservas/", { params }),
  listMine: () => api.get("/reservas/", { params: { mias: 1 } }),
  create: (payload) => api.post("/reservas/", payload),
  cancelar: (id) => api.post(`/reservas/${id}/cancelar/`),
  aprobar: (id) => api.post(`/reservas/${id}/aprobar/`), // solo admin debe
};

export default ReservaService;
