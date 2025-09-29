// src/services/avisoService.js
import api from './api';

const base = '/avisos';
const adjBase = '/avisos-adjuntos';

const list = (params = {}) => api.get(base + '/', { params });
const get = (id) => api.get(`${base}/${id}/`);
const create = (payload) => api.post(base + '/', payload);
const update = (id, payload) => api.put(`${base}/${id}/`, payload);
const remove = (id) => api.delete(`${base}/${id}/`);

const publicar = (id) => api.post(`${base}/${id}/publicar/`);
const archivar = (id) => api.post(`${base}/${id}/archivar/`);
const aprobar = (id) => api.post(`${base}/${id}/aprobar/`);
const rechazar = (id) => api.post(`${base}/${id}/rechazar/`);
const enviarAprobacion = (id) => api.post(`${base}/${id}/enviar_aprobacion/`);

const uploadAdjunto = (avisoId, file) => {
  const form = new FormData();
  form.append('aviso', avisoId);
  form.append('archivo', file);
  return api.post(`${adjBase}/`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
const deleteAdjunto = (adjuntoId) => api.delete(`${adjBase}/${adjuntoId}/`);

export const avisoService = {
  list, get, create, update, remove,
  publicar, archivar, aprobar, rechazar, enviarAprobacion,
  uploadAdjunto, deleteAdjunto,
};

export default avisoService;
