import {
  ArrowForward as ArrowForwardIcon,
  AttachMoney as MoneyIcon,
  Notifications as NotificationsIcon,
  People as PeopleIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Grid,
  Typography
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AvisosWidget from '../components/common/AvisosWidget';
import { packagesConfig } from '../config/packages';

const Dashboard = () => {
  const navigate = useNavigate();

  const iconos = {
    people: <PeopleIcon sx={{ fontSize: 40 }} />,
    attach_money: <MoneyIcon sx={{ fontSize: 40 }} />,
    security: <SecurityIcon sx={{ fontSize: 40 }} />,
    notifications: <NotificationsIcon sx={{ fontSize: 40 }} />
  };

  const getColorPorPaquete = (paqueteId) => {
    const colores = {
      'identidad-unidades': 'primary',
      'finanzas-cobranza': 'secondary',
      'ia-seguridad': 'error',
      'operaciones-notificaciones': 'success'
    };
    return colores[paqueteId] || 'default';
  };

  const handleVerPaquete = (paquete) => {
    // Navegar al primer caso de uso implementado del paquete, o al primero disponible
    const casoImplementado = paquete.casosUso.find(cu => cu.implementado);
    if (casoImplementado) {
      navigate(casoImplementado.ruta);
    } else if (paquete.casosUso.length > 0) {
      navigate(paquete.casosUso[0].ruta);
    }
  };

  const getCasosUsoImplementadosCount = (paquete) => {
    return paquete.casosUso.filter(cu => cu.implementado).length;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard - Smart Condominium
      </Typography>
      <Typography variant="subtitle1" gutterBottom sx={{ mb: 4 }}>
        Sistema integral de gestión de condominios
      </Typography>

      {/* Row de widgets superiores */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <AvisosWidget maxItems={5} />
        </Grid>
        {/* Puedes añadir más widgets aquí en el futuro */}
      </Grid>

      {/* Paquetes */}
      <Grid container spacing={3}>
        {packagesConfig.map((paquete) => (
          <Grid item xs={12} md={6} key={paquete.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ color: `${getColorPorPaquete(paquete.id)}.main`, mr: 2 }}>
                    {iconos[paquete.icono]}
                  </Box>
                  <Box>
                    <Typography variant="h5" component="h2">
                      {paquete.nombre}
                    </Typography>
                    <Chip 
                      label={`${getCasosUsoImplementadosCount(paquete)}/${paquete.casosUso.length} implementados`}
                      size="small"
                      color={getCasosUsoImplementadosCount(paquete) === paquete.casosUso.length ? 'success' : 'warning'}
                    />
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Casos de uso incluidos:
                </Typography>
                
                <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {paquete.casosUso.map((casoUso) => (
                    <Box 
                      key={casoUso.id}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 1,
                        opacity: casoUso.implementado ? 1 : 0.6
                      }}
                    >
                      <Chip 
                        label={casoUso.id.toUpperCase()}
                        size="small"
                        color={casoUso.implementado ? 'primary' : 'default'}
                        variant={casoUso.implementado ? 'filled' : 'outlined'}
                      />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {casoUso.nombre}
                        {!casoUso.implementado && ' (En desarrollo)'}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
              
              <CardActions>
                <Button 
                  size="small" 
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => handleVerPaquete(paquete)}
                  disabled={getCasosUsoImplementadosCount(paquete) === 0}
                >
                  Acceder al Paquete
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Resumen de Progreso */}
      <Card sx={{ mt: 4, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Resumen de Implementación
        </Typography>
        <Grid container spacing={2}>
          {packagesConfig.map((paquete) => {
            const implementados = getCasosUsoImplementadosCount(paquete);
            const total = paquete.casosUso.length;
            const porcentaje = Math.round((implementados / total) * 100);
            
            return (
              <Grid item xs={12} sm={6} md={3} key={paquete.id}>
                <Box>
                  <Typography variant="body2" gutterBottom>
                    {paquete.nombre}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <Box 
                        sx={{ 
                          width: `${porcentaje}%`, 
                          height: 8, 
                          backgroundColor: 'primary.main',
                          borderRadius: 4
                        }} 
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {porcentaje}%
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Card>
    </Box>
  );
};

export default Dashboard;
