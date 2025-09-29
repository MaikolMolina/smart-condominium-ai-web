import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { facialService } from '../../services/facialService';

const PanelMonitoreo = () => {
  const [ultimosAccesos, setUltimosAccesos] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);

  useEffect(() => {
    cargarDatos();
    // Actualizar cada 30 segundos
    const interval = setInterval(cargarDatos, 30000);
    return () => clearInterval(interval);
  }, []);

  const cargarDatos = async () => {
    try {
      const [estadisticasResponse, accesosResponse] = await Promise.all([
        facialService.obtenerEstadisticas(),
        facialService.obtenerAccesos({ limit: 10 })
      ]);
      
      setEstadisticas(estadisticasResponse.data);
      setUltimosAccesos(accesosResponse.data.results || accesosResponse.data);
    } catch (error) {
      console.error('Error cargando datos de monitoreo:', error);
    }
  };

  const getColorEstado = (estado) => {
    switch (estado) {
      case 'exitoso': return 'success';
      case 'fallido': return 'error';
      default: return 'default';
    }
  };

  const getColorTipoAcceso = (tipo) => {
    switch (tipo) {
      case 'entrada': return 'primary';
      case 'salida': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Panel de Monitoreo en Tiempo Real
      </Typography>

      {/* Estadísticas */}
      {estadisticas && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Rostros Registrados
                </Typography>
                <Typography variant="h4">
                  {estadisticas.total_rostros_registrados}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Accesos Hoy
                </Typography>
                <Typography variant="h4">
                  {estadisticas.accesos_hoy}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Accesos
                </Typography>
                <Typography variant="h4">
                  {estadisticas.total_accesos_registrados}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Última Actualización
                </Typography>
                <Typography variant="h6">
                  {new Date().toLocaleTimeString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Últimos Accesos */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Últimos Accesos Registrados
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Confianza</TableCell>
                  <TableCell>Fecha/Hora</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ultimosAccesos.map((acceso) => (
                  <TableRow key={acceso.id}>
                    <TableCell>
                      {acceso.usuario_info 
                        ? `${acceso.usuario_info.first_name} ${acceso.usuario_info.last_name}`
                        : 'Desconocido'
                      }
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={acceso.tipo_acceso} 
                        color={getColorTipoAcceso(acceso.tipo_acceso)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={acceso.estado} 
                        color={getColorEstado(acceso.estado)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {acceso.confianza ? `${(acceso.confianza * 100).toFixed(1)}%` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {new Date(acceso.timestamp).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PanelMonitoreo;