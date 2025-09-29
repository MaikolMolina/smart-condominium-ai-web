import api from './api';

export const facialService = {
  // Procesamiento automático de acceso
  procesarAccesoAutomatico: (embedding, imagen) => {
    return api.post('/rostros/procesar_acceso_automatico/', {
      embedding: JSON.stringify(embedding),
      imagen: imagen
    });
  },

  // Obtener estadísticas del sistema
  obtenerEstadisticas: () => {
    return api.get('/rostros/estadisticas/');
  },

  // Configuración del sistema
  obtenerConfiguracion: () => {
    return api.get('/configuracion-reconocimiento/obtener_configuracion/');
  },

  actualizarConfiguracion: (configuraciones) => {
    return api.post('/configuracion-reconocimiento/actualizar_configuracion/', configuraciones);
  },
  // Gestión de rostros
  registrarRostro: (usuarioId, embedding, imagen) => {
    return api.post('/rostros/registrar_rostro/', {
      usuario_id: usuarioId,
      embedding: JSON.stringify(embedding),
      imagen: imagen
    });
  },

  reconocerRostro: (embedding, umbral = 0.6) => {
    return api.post('/rostros/reconocer_rostro/', {
      embedding: JSON.stringify(embedding),
      umbral: umbral
    });
  },

  obtenerRostros: () => {
    return api.get('/rostros/');
  },

  eliminarRostro: (id) => {
    return api.delete(`/rostros/${id}/`);
  },

  // Registros de acceso
  registrarAcceso: (usuarioId, tipoAcceso, confianza, imagen) => {
    return api.post('/accesos/registrar_acceso/', {
      usuario_id: usuarioId,
      tipo_acceso: tipoAcceso,
      confianza: confianza,
      imagen: imagen
    });
  },

  obtenerAccesos: (params = {}) => {
    return api.get('/accesos/', { params });
  }
};