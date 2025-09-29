import {
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Event as EventIcon
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
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePrivileges } from '../../hooks/usePrivileges';
import { invitadoService } from '../../services/invitadoService';


const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const InvitadoList = () => {
  const [invitados, setInvitados] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAprobarDialog, setOpenAprobarDialog] = useState(false);
  const [editingInvitado, setEditingInvitado] = useState(null);
  const [invitadoSeleccionado, setInvitadoSeleccionado] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [observaciones, setObservaciones] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    ci: '',
    email: '',
    telefono: '',
    tipo_evento: 'reunion',
    descripcion_evento: '',
    fecha_evento: '',
    hora_inicio: '18:00',
    hora_fin: '20:00',
    numero_invitados: 1
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const { tienePrivilegio } = usePrivileges();
  const { currentUser } = useAuth();

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const loadInvitados = useCallback(async () => {
    try {
      let params = {};
      if (tabValue === 1) params.estado = 'pendiente';
      if (tabValue === 2) params.estado = 'aprobado';
      if (tabValue === 3) params.estado = 'rechazado';
      
      const response = await invitadoService.getAll(params);
      setInvitados(response.data);
    } catch (error) {
      console.error('Error loading invitados:', error);
      showSnackbar('Error al cargar invitados', 'error');
    }
  }, [tabValue, showSnackbar]);

  useEffect(() => {
    loadInvitados();
  }, [loadInvitados]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = (invitado = null) => {
    if (invitado) {
      setEditingInvitado(invitado);
      setFormData({
        nombre: invitado.nombre,
        apellido: invitado.apellido,
        ci: invitado.ci,
        email: invitado.email || '',
        telefono: invitado.telefono || '',
        tipo_evento: invitado.tipo_evento,
        descripcion_evento: invitado.descripcion_evento || '',
        fecha_evento: invitado.fecha_evento,
        hora_inicio: invitado.hora_inicio,
        hora_fin: invitado.hora_fin,
        numero_invitados: invitado.numero_invitados
      });
    } else {
      setEditingInvitado(null);
      setFormData({
        nombre: '',
        apellido: '',
        ci: '',
        email: '',
        telefono: '',
        tipo_evento: 'reunion',
        descripcion_evento: '',
        fecha_evento: '',
        hora_inicio: '18:00',
        hora_fin: '20:00',
        numero_invitados: 1
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenAprobarDialog = (invitado, aprobar = true) => {
    setInvitadoSeleccionado(invitado);
    setObservaciones('');
    setOpenAprobarDialog(aprobar);
  };

  const handleCloseAprobarDialog = () => {
    setOpenAprobarDialog(false);
    setInvitadoSeleccionado(null);
    setObservaciones('');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingInvitado) {
        await invitadoService.update(editingInvitado.id, formData);
        showSnackbar('Invitado actualizado correctamente');
      } else {
        await invitadoService.create(formData);
        showSnackbar('Invitado creado correctamente');
      }
      loadInvitados();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving invitado:', error.response?.data || error.message);
      showSnackbar(
        'Error al guardar invitado: ' + JSON.stringify(error.response?.data || error.message), 
        'error'
      );
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este invitado?')) {
      try {
        await invitadoService.delete(id);
        showSnackbar('Invitado eliminado correctamente');
        loadInvitados();
      } catch (error) {
        console.error('Error deleting invitado:', error);
        showSnackbar('Error al eliminar invitado', 'error');
      }
    }
  };

  const handleAprobar = async () => {
    try {
      await invitadoService.aprobar(invitadoSeleccionado.id);
      showSnackbar('Invitado aprobado correctamente');
      loadInvitados();
      handleCloseAprobarDialog();
    } catch (error) {
      console.error('Error approving invitado:', error);
      showSnackbar('Error al aprobar invitado', 'error');
    }
  };

  const handleRechazar = async () => {
    try {
      await invitadoService.rechazar(invitadoSeleccionado.id, observaciones);
      showSnackbar('Invitado rechazado correctamente');
      loadInvitados();
      handleCloseAprobarDialog();
    } catch (error) {
      console.error('Error rejecting invitado:', error);
      showSnackbar('Error al rechazar invitado', 'error');
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'aprobado': return 'success';
      case 'pendiente': return 'warning';
      case 'rechazado': return 'error';
      default: return 'default';
    }
  };

  const getTipoEventoText = (tipo) => {
    const tipos = {
      'cumpleanos': 'Cumpleaños',
      'reunion': 'Reunión',
      'fiesta': 'Fiesta',
      'otro': 'Otro'
    };
    return tipos[tipo] || tipo;
  };

  const puedeEditar = (invitado) => {
    return currentUser.is_superuser || invitado.residente === currentUser.id;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Gestión de Invitados
        </Typography>
        {tienePrivilegio('guests.create') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nuevo Invitado
          </Button>
        )}
      </Box>

      {/* Tabs para filtrar por estado */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Todos" />
          <Tab label="Pendientes" />
          <Tab label="Aprobados" />
          <Tab label="Rechazados" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {invitados.map((invitado) => (
            <Grid item xs={12} md={6} key={invitado.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {invitado.nombre} {invitado.apellido}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        CI: {invitado.ci} | Tel: {invitado.telefono || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        <EventIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                        {new Date(invitado.fecha_evento).toLocaleDateString()} • 
                        {invitado.hora_inicio} - {invitado.hora_fin}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        Evento: {getTipoEventoText(invitado.tipo_evento)}
                      </Typography>
                      {invitado.descripcion_evento && (
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          {invitado.descripcion_evento}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip 
                          label={invitado.estado} 
                          color={getEstadoColor(invitado.estado)} 
                          size="small" 
                        />
                        <Chip 
                          label={`${invitado.numero_invitados} invitados`}
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                      {invitado.observaciones && (
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                          Observaciones: {invitado.observaciones}
                        </Typography>
                      )}
                    </Box>
                    <Box>
                      {puedeEditar(invitado) && tienePrivilegio('guests.edit') && (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog(invitado)}
                        >
                          <EditIcon />
                        </IconButton>
                      )}
                      {puedeEditar(invitado) && tienePrivilegio('guests.delete') && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(invitado.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                      {currentUser.is_superuser && invitado.estado === 'pendiente' && (
                        <>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleOpenAprobarDialog(invitado, true)}
                          >
                            <CheckIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleOpenAprobarDialog(invitado, false)}
                          >
                            <CloseIcon />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Repite TabPanel para los otros estados (index 1, 2, 3) con el mismo contenido */}

      {/* Diálogo para crear/editar invitado */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingInvitado ? 'Editar Invitado' : 'Nuevo Invitado'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Apellido"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Cédula de Identidad"
                  name="ci"
                  value={formData.ci}
                  onChange={handleChange}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Teléfono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Evento</InputLabel>
                  <Select
                    name="tipo_evento"
                    value={formData.tipo_evento}
                    onChange={handleChange}
                    label="Tipo de Evento"
                  >
                    <MenuItem value="cumpleanos">Cumpleaños</MenuItem>
                    <MenuItem value="reunion">Reunión</MenuItem>
                    <MenuItem value="fiesta">Fiesta</MenuItem>
                    <MenuItem value="otro">Otro</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Número de Invitados"
                  name="numero_invitados"
                  type="number"
                  value={formData.numero_invitados}
                  onChange={handleChange}
                  required
                  fullWidth
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Fecha del Evento"
                  name="fecha_evento"
                  type="date"
                  value={formData.fecha_evento}
                  onChange={handleChange}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Hora Inicio"
                  name="hora_inicio"
                  type="time"
                  value={formData.hora_inicio}
                  onChange={handleChange}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Hora Fin"
                  name="hora_fin"
                  type="time"
                  value={formData.hora_fin}
                  onChange={handleChange}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Descripción del Evento"
                  name="descripcion_evento"
                  value={formData.descripcion_evento}
                  onChange={handleChange}
                  multiline
                  rows={3}
                  fullWidth
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained">
              {editingInvitado ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Diálogo para aprobar/rechazar */}
      <Dialog open={!!openAprobarDialog} onClose={handleCloseAprobarDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {openAprobarDialog ? 'Aprobar Invitado' : 'Rechazar Invitado'}
        </DialogTitle>
        <DialogContent>
          {invitadoSeleccionado && (
            <Box>
              <Typography gutterBottom>
                {openAprobarDialog ? '¿Está seguro de aprobar este invitado?' : '¿Está seguro de rechazar este invitado?'}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Invitado: {invitadoSeleccionado.nombre} {invitadoSeleccionado.apellido}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Evento: {getTipoEventoText(invitadoSeleccionado.tipo_evento)} el {new Date(invitadoSeleccionado.fecha_evento).toLocaleDateString()}
              </Typography>
              
              {!openAprobarDialog && (
                <TextField
                  label="Observaciones (opcional)"
                  name="observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                  sx={{ mt: 2 }}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAprobarDialog}>Cancelar</Button>
          <Button 
            onClick={openAprobarDialog ? handleAprobar : handleRechazar} 
            variant="contained"
            color={openAprobarDialog ? "success" : "error"}
          >
            {openAprobarDialog ? 'Aprobar' : 'Rechazar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InvitadoList;