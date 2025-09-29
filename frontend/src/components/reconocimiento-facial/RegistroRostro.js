import {
    Camera as CameraIcon,
    Replay as ReplayIcon,
    Save as SaveIcon
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Snackbar,
    Typography
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { usePrivileges } from '../../hooks/usePrivileges';
import { facialService } from '../../services/facialService';
import { userService } from '../../services/userService';
import { FacialRecognition, canvasToBase64, captureFrame } from '../../utils/faceAPI';

const RegistroRostro = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('');
  const [embedding, setEmbedding] = useState(null);
  const [captura, setCaptura] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [facialRecognition, setFacialRecognition] = useState(null);

  const { tienePrivilegio } = usePrivileges();

  useEffect(() => {
    // Inicializar FaceAPI
    const initFacialRecognition = async () => {
      const fr = new FacialRecognition();
      await fr.loadModels();
      setFacialRecognition(fr);
    };

    initFacialRecognition();
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const response = await userService.getAll();
      setUsuarios(response.data);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  };

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
  };

  const capturarRostro = async () => {
    if (!facialRecognition || !usuarioSeleccionado) return;

    setCargando(true);
    try {
      const canvas = captureFrame(videoRef.current);
      const embeddingData = await facialRecognition.getFaceEmbedding(canvas);

      if (embeddingData) {
        setEmbedding(embeddingData);
        setCaptura(canvasToBase64(canvas));
        mostrarSnackbar('Rostro capturado correctamente', 'success');
      } else {
        mostrarSnackbar('No se detectó ningún rostro', 'error');
      }
    } catch (error) {
      console.error('Error capturando rostro:', error);
      mostrarSnackbar('Error al procesar el rostro', 'error');
    }
    setCargando(false);
  };

  const registrarRostro = async () => {
    if (!embedding || !usuarioSeleccionado) return;

    setCargando(true);
    try {
      await facialService.registrarRostro(usuarioSeleccionado, embedding, captura);
      mostrarSnackbar('Rostro registrado exitosamente', 'success');
      resetearCaptura();
    } catch (error) {
      console.error('Error registrando rostro:', error);
      mostrarSnackbar('Error al registrar el rostro', 'error');
    }
    setCargando(false);
  };

  const resetearCaptura = () => {
    setEmbedding(null);
    setCaptura(null);
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
        Registro de Rostros
      </Typography>
      <Typography variant="body1" gutterBottom>
        Registre los rostros de los usuarios para el sistema de reconocimiento facial.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cámara
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Seleccionar Usuario</InputLabel>
                  <Select
                    value={usuarioSeleccionado}
                    onChange={(e) => setUsuarioSeleccionado(e.target.value)}
                    label="Seleccionar Usuario"
                  >
                    {usuarios.map((usuario) => (
                      <MenuItem key={usuario.id} value={usuario.id}>
                        {usuario.first_name} {usuario.last_name} - {usuario.ci}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  variant="contained"
                  onClick={iniciarCamara}
                  disabled={!!stream}
                  startIcon={<CameraIcon />}
                >
                  Iniciar Cámara
                </Button>
                <Button
                  variant="outlined"
                  onClick={detenerCamara}
                  disabled={!stream}
                >
                  Detener Cámara
                </Button>
              </Box>

              <video
                ref={videoRef}
                autoPlay
                muted
                style={{ 
                  width: '100%', 
                  maxWidth: '100%',
                  border: '2px solid #ccc',
                  borderRadius: '4px',
                  display: stream ? 'block' : 'none'
                }}
              />

              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={capturarRostro}
                  disabled={!stream || cargando || !usuarioSeleccionado}
                  startIcon={cargando ? <CircularProgress size={20} /> : <CameraIcon />}
                >
                  {cargando ? 'Procesando...' : 'Capturar Rostro'}
                </Button>
                
                {embedding && (
                  <Button
                    variant="outlined"
                    onClick={resetearCaptura}
                    startIcon={<ReplayIcon />}
                  >
                    Recapturar
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Vista Previa y Registro
              </Typography>

              {captura ? (
                <Box>
                  <img 
                    src={captura} 
                    alt="Rostro capturado" 
                    style={{ 
                      width: '100%', 
                      maxWidth: '300px',
                      border: '2px solid #4caf50',
                      borderRadius: '4px'
                    }}
                  />
                  <Typography variant="body2" sx={{ mt: 1, color: 'success.main' }}>
                    ✓ Rostro detectado correctamente
                  </Typography>
                  
                  <Button
                    variant="contained"
                    onClick={registrarRostro}
                    disabled={cargando}
                    startIcon={cargando ? <CircularProgress size={20} /> : <SaveIcon />}
                    sx={{ mt: 2 }}
                    fullWidth
                  >
                    {cargando ? 'Registrando...' : 'Registrar Rostro'}
                  </Button>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Capture un rostro para ver la vista previa
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RegistroRostro;