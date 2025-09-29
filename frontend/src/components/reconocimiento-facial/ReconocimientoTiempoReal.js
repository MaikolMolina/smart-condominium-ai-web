import {
    PlayArrow as PlayIcon,
    Security as SecurityIcon,
    Stop as StopIcon
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
    Snackbar,
    Typography
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { facialService } from '../../services/facialService';
import { FacialRecognition, canvasToBase64, captureFrame } from '../../utils/faceAPI';

const ReconocimientoTiempoReal = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [reconociendo, setReconociendo] = useState(false);
  const [ultimoReconocimiento, setUltimoReconocimiento] = useState(null);
  const [facialRecognition, setFacialRecognition] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [dialogoAcceso, setDialogoAcceso] = useState(false);
  const [accesoPendiente, setAccesoPendiente] = useState(null);

  useEffect(() => {
    const initFacialRecognition = async () => {
      const fr = new FacialRecognition();
      await fr.loadModels();
      setFacialRecognition(fr);
    };

    initFacialRecognition();
  }, []);

  const iniciarCamara = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      setStream(mediaStream);
      videoRef.current.srcObject = mediaStream;
    } catch (error) {
      console.error('Error accediendo a la cámara:', error);
      mostrarSnackbar('Error al acceder a la cámara', 'error');
    }
  };

  const detenerCamara = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    detenerReconocimiento();
  };

  const iniciarReconocimiento = () => {
    if (!facialRecognition) return;
    
    setReconociendo(true);
    realizarReconocimiento();
  };

  const detenerReconocimiento = () => {
    setReconociendo(false);
    setUltimoReconocimiento(null);
  };

  const realizarReconocimiento = async () => {
    if (!reconociendo || !facialRecognition) return;

    try {
      const canvas = captureFrame(videoRef.current);
      const embedding = await facialRecognition.getFaceEmbedding(canvas);

      if (embedding) {
        const resultado = await facialService.reconocerRostro(embedding, 0.7);
        
        if (resultado.data.reconocido) {
          setUltimoReconocimiento(resultado.data);
          mostrarDialogoAcceso(resultado.data);
        } else {
          setUltimoReconocimiento({
            reconocido: false,
            confianza: 0,
            mensaje: 'Usuario no reconocido'
          });
        }
      }

      // Continuar el reconocimiento después de un intervalo
      if (reconociendo) {
        setTimeout(realizarReconocimiento, 2000); // Reconocer cada 2 segundos
      }
    } catch (error) {
      console.error('Error en reconocimiento:', error);
      if (reconociendo) {
        setTimeout(realizarReconocimiento, 2000);
      }
    }
  };

  const mostrarDialogoAcceso = (reconocimiento) => {
    setAccesoPendiente(reconocimiento);
    setDialogoAcceso(true);
  };

  const registrarAcceso = async (tipoAcceso) => {
    if (!accesoPendiente) return;

    try {
      const canvas = captureFrame(videoRef.current);
      const imagenCaptura = canvasToBase64(canvas);

      await facialService.registrarAcceso(
        accesoPendiente.usuario.id,
        tipoAcceso,
        accesoPendiente.confianza,
        imagenCaptura
      );

      mostrarSnackbar(`Acceso de ${tipoAcceso} registrado exitosamente`, 'success');
      setDialogoAcceso(false);
      setAccesoPendiente(null);
    } catch (error) {
      console.error('Error registrando acceso:', error);
      mostrarSnackbar('Error al registrar el acceso', 'error');
    }
  };

  const mostrarSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Reconocimiento Facial en Tiempo Real
      </Typography>
      <Typography variant="body1" gutterBottom>
        Sistema de control de acceso mediante reconocimiento facial.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cámara de Reconocimiento
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  variant="contained"
                  onClick={iniciarCamara}
                  disabled={!!stream}
                  startIcon={<PlayIcon />}
                >
                  Iniciar Cámara
                </Button>
                <Button
                  variant="outlined"
                  onClick={detenerCamara}
                  disabled={!stream}
                  startIcon={<StopIcon />}
                >
                  Detener Cámara
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={iniciarReconocimiento}
                  disabled={!stream || reconociendo}
                  startIcon={<SecurityIcon />}
                >
                  {reconociendo ? 'Reconociendo...' : 'Iniciar Reconocimiento'}
                </Button>
                {reconociendo && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={detenerReconocimiento}
                  >
                    Detener
                  </Button>
                )}
              </Box>

              <video
                ref={videoRef}
                autoPlay
                muted
                style={{ 
                  width: '100%', 
                  maxWidth: '100%',
                  border: '2px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Estado del Sistema
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Chip 
                  label={stream ? 'Cámara Activa' : 'Cámara Inactiva'} 
                  color={stream ? 'success' : 'default'} 
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
                <Chip 
                  label={reconociendo ? 'Reconociendo' : 'En Espera'} 
                  color={reconociendo ? 'primary' : 'default'} 
                  variant="outlined"
                  sx={{ mb: 1, ml: 1 }}
                />
              </Box>

              {ultimoReconocimiento && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Último Reconocimiento:
                  </Typography>
                  
                  {ultimoReconocimiento.reconocido ? (
                    <Box sx={{ p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                      <Typography variant="body2" color="white">
                        ✓ Usuario Reconocido
                      </Typography>
                      <Typography variant="body2" color="white">
                        {ultimoReconocimiento.usuario.first_name} {ultimoReconocimiento.usuario.last_name}
                      </Typography>
                      <Typography variant="body2" color="white">
                        Confianza: {(ultimoReconocimiento.confianza * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ p: 1, bgcolor: 'error.light', borderRadius: 1 }}>
                      <Typography variant="body2" color="white">
                        ✗ Usuario No Reconocido
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Diálogo para registrar acceso */}
      <Dialog open={dialogoAcceso} onClose={() => setDialogoAcceso(false)}>
        <DialogTitle>Registrar Acceso</DialogTitle>
        <DialogContent>
          {accesoPendiente && accesoPendiente.reconocido && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Usuario reconocido: <strong>{accesoPendiente.usuario.first_name} {accesoPendiente.usuario.last_name}</strong>
              </Typography>
              <Typography variant="body2" gutterBottom>
                Confianza: {(accesoPendiente.confianza * 100).toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Seleccione el tipo de acceso:
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoAcceso(false)}>Cancelar</Button>
          <Button 
            onClick={() => registrarAcceso('entrada')} 
            variant="contained" 
            color="success"
          >
            Registrar Entrada
          </Button>
          <Button 
            onClick={() => registrarAcceso('salida')} 
            variant="contained" 
            color="warning"
          >
            Registrar Salida
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReconocimientoTiempoReal;