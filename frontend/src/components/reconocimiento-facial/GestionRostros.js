import {
    Delete as DeleteIcon
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    Grid,
    IconButton,
    Snackbar,
    Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { usePrivileges } from '../../hooks/usePrivileges';
import { facialService } from '../../services/facialService';

const GestionRostros = () => {
  const [rostros, setRostros] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { tienePrivilegio } = usePrivileges();

  useEffect(() => {
    cargarRostros();
  }, []);

  const cargarRostros = async () => {
    try {
      const response = await facialService.obtenerRostros();
      setRostros(response.data);
    } catch (error) {
      console.error('Error cargando rostros:', error);
      mostrarSnackbar('Error al cargar los rostros', 'error');
    }
  };

  const eliminarRostro = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este registro de rostro?')) return;

    try {
      await facialService.eliminarRostro(id);
      mostrarSnackbar('Rostro eliminado correctamente', 'success');
      cargarRostros();
    } catch (error) {
      console.error('Error eliminando rostro:', error);
      mostrarSnackbar('Error al eliminar el rostro', 'error');
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
        Gestión de Rostros Registrados
      </Typography>
      <Typography variant="body1" gutterBottom>
        Administre los rostros registrados en el sistema de reconocimiento facial.
      </Typography>

      <Grid container spacing={3}>
        {rostros.map((rostro) => (
          <Grid item xs={12} md={6} lg={4} key={rostro.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {rostro.usuario_info.first_name} {rostro.usuario_info.last_name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      CI: {rostro.usuario_info.ci}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Registrado: {new Date(rostro.fecha_registro).toLocaleDateString()}
                    </Typography>
                    
                    <Box sx={{ mt: 1 }}>
                      <Chip 
                        label={rostro.esta_activo ? 'Activo' : 'Inactivo'} 
                        color={rostro.esta_activo ? 'success' : 'default'} 
                        size="small" 
                      />
                    </Box>
                  </Box>
                  
                  <Box>
                    {tienePrivilegio('facial.delete') && (
                      <IconButton
                        color="error"
                        onClick={() => eliminarRostro(rostro.id)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                </Box>

                {rostro.imagen_referencia && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <img 
                      src={rostro.imagen_referencia} 
                      alt={`Rostro de ${rostro.usuario_info.first_name}`}
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '200px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {rostros.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No hay rostros registrados en el sistema.
          </Typography>
        </Box>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GestionRostros;