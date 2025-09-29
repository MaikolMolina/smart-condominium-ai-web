import {
    Person as PersonIcon,
    PlayArrow as PlayIcon,
    Security as SecurityIcon,
    Settings as SettingsIcon,
    Stop as StopIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Snackbar,
    Tooltip,
    Typography
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { facialService } from '../../services/facialService';
import { FacialRecognition, canvasToBase64, captureFrame } from '../../utils/faceAPI';

const MonitorAccesoAutomatico = () => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [monitoreando, setMonitoreando] = useState(false);
  const [facialRecognition, setFacialRecognition] = useState(null);
  const [ultimoEvento, setUltimoEvento] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [configuracion, setConfiguracion] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [dialogoConfiguracion, setDialogoConfiguracion] = useState(false);

  useEffect(() => {
    const inicializarSistema = async () => {
      const fr = new FacialRecognition();
      await fr.loadModels();
      setFacialRecognition(fr);
      cargarEstadisticas();
      cargarConfiguracion();
    };

    inicializarSistema();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const response = await facialService.obtenerEstadisticas();
      setEstadisticas(response.data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const cargarConfiguracion = async () => {
    try {
      const response = await facialService.obtenerConfiguracion();
      setConfiguracion(response.data);
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  };

  const iniciarCamara = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: 'environment' } 
      });
      setStream(mediaStream);
      videoRef.current.srcObject = mediaStream;
    } catch (error) {
      console.error('Error accediendo a la cámara:', error);
      mostrarSnackbar('Error al acceder a la cámara de entrada', 'error');
    }
  };

  const detenerCamara = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    detenerMonitoreo();
  };

  const iniciarMonitoreo = () => {
    if (!facialRecognition) return;
    setMonitoreando(true);
    realizarMonitoreo();
  };

  const detenerMonitoreo = () => {
    setMonitoreando(false);
    setUltimoEvento(null);
  };

  const realizarMonitoreo = async () => {
    if (!monitoreando || !facialRecognition) return;

    try {
      const canvas = captureFrame(videoRef.current);
      const embedding = await facialRecognition.getFaceEmbedding(canvas);

      if (embedding) {
        const imagenCaptura = canvasToBase64(canvas);
        const resultado = await facialService.procesarAccesoAutomatico(embedding, imagenCaptura);

        if (resultado.data.acceso_permitido) {
          setUltimoEvento({
            tipo: 'acceso_exitoso',
            usuario: resultado.data.usuario,
            tipoAcceso: resultado.data.tipo_acceso,
            confianza: resultado.data.confianza,
            timestamp: new Date(),
            mensaje: resultado.data.mensaje
          });
          mostrarSnackbar(resultado.data.mensaje, 'success');
        } else {
          setUltimoEvento({
            tipo: 'acceso_denegado',
            confianza: resultado.data.confianza,
            timestamp: new Date(),
            mensaje: resultado.data.mensaje
          });
          mostrarSnackbar(resultado.data.mensaje, 'warning');
        }

        // Actualizar estadísticas
        cargarEstadisticas();
      }

      // Continuar monitoreo después de un intervalo
      if (monitoreando) {
        setTimeout(realizarMonitoreo, 3000); // Monitorear cada 3 segundos
      }
    } catch (error) {
      console.error('Error en monitoreo:', error);
      if (monitoreando) {
        setTimeout(realizarMonitoreo, 3000);
      }
    }
  };

  const mostrarSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getColorEvento = (tipo) => {
    switch (tipo) {
      case 'acceso_exitoso': return 'success';
      case 'acceso_denegado': return 'warning';
      default: return 'info';
    }
  };

  const getIconoEvento = (tipo) => {
    switch (tipo) {
      case 'acceso_exitoso': return <PersonIcon />;
      case 'acceso_denegado': return <WarningIcon />;
      default: return <SecurityIcon />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Monitor de Acceso Automático
        </Typography>
        <Tooltip title="Configuración">
          <IconButton onClick={() => setDialogoConfiguracion(true)}>
            <SettingsIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Typography variant="body1" gutterBottom>
        Sistema de reconocimiento facial automático para control de acceso en la entrada principal.
      </Typography>

      <Grid container spacing={3}>
        {/* Panel de Control */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Control del Sistema
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                <Button
                  variant="contained"
                  onClick={iniciarCamara}
                  disabled={!!stream}
                  startIcon={<PlayIcon />}
                  fullWidth
                >
                  Activar Cámara
                </Button>
                <Button
                  variant="outlined"
                  onClick={detenerCamara}
                  disabled={!stream}
                  startIcon={<StopIcon />}
                  fullWidth
                >
                  Desactivar Cámara
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={iniciarMonitoreo}
                  disabled={!stream || monitoreando}
                  startIcon={<SecurityIcon />}
                  fullWidth
                >
                  {monitoreando ? 'Monitoreando...' : 'Iniciar Monitoreo'}
                </Button>
                {monitoreando && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={detenerMonitoreo}
                    fullWidth
                  >
                    Detener Monitoreo
                  </Button>
                )}
              </Box>

              {/* Estado del Sistema */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Estado del Sistema:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip 
                    label={stream ? 'Cámara Activa' : 'Cámara Inactiva'} 
                    color={stream ? 'success' : 'default'} 
                    size="small" 
                  />
                  <Chip 
                    label={monitoreando ? 'Monitoreando' : 'En Espera'} 
                    color={monitoreando ? 'primary' : 'default'} 
                    size="small" 
                  />
                </Box>
              </Box>

              {/* Estadísticas Rápidas */}
              {estadisticas && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Estadísticas:
                  </Typography>
                  <Typography variant="body2">
                    • Rostros registrados: {estadisticas.total_rostros_registrados}
                  </Typography>
                  <Typography variant="body2">
                    • Accesos hoy: {estadisticas.accesos_hoy}
                  </Typography>
                  <Typography variant="body2">
                    • Total accesos: {estadisticas.total_accesos_registrados}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Cámara y Último Evento */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            {/* Vista de la Cámara */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Cámara de Entrada/Principal
                  </Typography>
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    style={{ 
                      width: '100%', 
                      maxWidth: '100%',
                      border: '3px solid #1976d2',
                      borderRadius: '8px',
                      background: '#000'
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Último Evento */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Último Evento de Acceso
                  </Typography>
                  
                  {ultimoEvento ? (
                    <Alert 
                      severity={getColorEvento(ultimoEvento.tipo)}
                      icon={getIconoEvento(ultimoEvento.tipo)}
                    >
                      <Typography variant="body1" fontWeight="bold">
                        {ultimoEvento.mensaje}
                      </Typography>
                      {ultimoEvento.usuario && (
                        <Typography variant="body2">
                          Usuario: {ultimoEvento.usuario.nombre}
                        </Typography>
                      )}
                      <Typography variant="body2">
                        Confianza: {(ultimoEvento.confianza * 100).toFixed(1)}%
                      </Typography>
                      <Typography variant="body2">
                        Hora: {ultimoEvento.timestamp.toLocaleTimeString()}
                      </Typography>
                    </Alert>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Esperando detección de personas...
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Diálogo de Configuración */}
      <Dialog open={dialogoConfiguracion} onClose={() => setDialogoConfiguracion(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configuración del Sistema</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Configuración del sistema de reconocimiento facial automático.
          </Typography>
          {/* Aquí puedes agregar controles para ajustar la configuración */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoConfiguracion(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MonitorAccesoAutomatico;