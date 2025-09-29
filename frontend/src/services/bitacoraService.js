/*import api from './api';

export const getBitacora = (params) => {
  return api.get('bitacora/', { params });
};*/


import api from './api';

export const getBitacora = async (params) => {
  try {
    const res = await api.get('bitacora/', { params });
    return res;
  } catch (e) {
    console.error('GET /bitacora/ FALLÓ', {
      baseURL: api.defaults.baseURL,
      fullURL: (api.defaults.baseURL || '') + 'bitacora/',
      status: e.response?.status,
      data: e.response?.data,
      params
    });
    throw e;
  }
};
