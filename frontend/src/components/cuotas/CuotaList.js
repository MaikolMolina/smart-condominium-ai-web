import React, { useState, useEffect, useCallback } from 'react';
import {
  IconButton,
  Button,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Chip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  //AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { cuotaService } from '../../services/cuotaService';
import { unidadService } from '../../services/unidadService';
import { usePrivileges } from '../../hooks/usePrivileges';

const CuotaList = () => {
  const [cuotas, setCuotas] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCuota, setEditingCuota] = useState(null);
  const [formData, setFormData] = useState({
    unidad_habitacional: '',
    monto: '',
    tipo: 'ordinaria',
    descripcion: '',
    fecha_vencimiento: '',
    estado: 'pendiente'
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { tienePrivilegio } = usePrivileges();

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const loadCuotas = useCallback(async () => {
    try {
      const response = await cuotaService.getAll();
      setCuotas(response.data);
    } catch (error) {
      console.error('Error loading cuotas:', error);
      showSnackbar('Error al cargar cuotas', 'error');
    }
  }, [showSnackbar]);

  const loadUnidades = useCallback(async () => {
    try {
      const response = await unidadService.getAll();
      setUnidades(response.data);
    } catch (error) {
      console.error('Error loading unidades:', error);
      showSnackbar('Error al cargar unidades', 'error');
    }
  }, [showSnackbar]);

  useEffect(() => {
    loadCuotas();
    loadUnidades();
  }, [loadCuotas, loadUnidades]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = (cuota = null) => {
    if (cuota) {
      setEditingCuota(cuota);
      setFormData({
        unidad_habitacional: cuota.unidad_habitacional,
        monto: cuota.monto,
        tipo: cuota.tipo,
        descripcion: cuota.descripcion || '',
        fecha_vencimiento: cuota.fecha_vencimiento,
        estado: cuota.estado
      });
    } else {
      setEditingCuota(null);
      setFormData({
        unidad_habitacional: '',
        monto: '',
        tipo: 'ordinaria',
        descripcion: '',
        fecha_vencimiento: '',
        estado: 'pendiente'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCuota) {
        await cuotaService.update(editingCuota.id, formData);
        showSnackbar('Cuota actualizada correctamente');
      } else {
        await cuotaService.create(formData);
        showSnackbar('Cuota creada correctamente');
      }
      loadCuotas();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving cuota:', error);
      showSnackbar('Error al guardar cuota', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta cuota?')) {
      try {
        await cuotaService.delete(id);
        showSnackbar('Cuota eliminada correctamente');
        loadCuotas();
      } catch (error) {
        console.error('Error deleting cuota:', error);
        showSnackbar('Error al eliminar cuota', 'error');
      }
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pagada': return 'success';
      case 'pendiente': return 'warning';
      case 'vencida': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Gestión de Cuotas y Expensas
        </Typography>
        {tienePrivilegio('fees.create') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nueva Cuota
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {cuotas.map((cuota) => (
          <Grid item xs={12} sm={6} md={4} key={cuota.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {cuota.unidad_habitacional_info?.torre || 'N/A'} - {cuota.unidad_habitacional_info?.piso || 'N/A'} - {cuota.unidad_habitacional_info?.numero}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Monto: ${cuota.monto}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Tipo: {cuota.tipo}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Vence: {new Date(cuota.fecha_vencimiento).toLocaleDateString()}
                    </Typography>
                    <Chip 
                      label={cuota.estado} 
                      color={getEstadoColor(cuota.estado)} 
                      size="small" 
                    />
                  </Box>
                  <Box>
                    {tienePrivilegio('fees.edit') && (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(cuota)}
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                    {tienePrivilegio('fees.delete') && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(cuota.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {tienePrivilegio('fees.create') || tienePrivilegio('fees.edit') ? (
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingCuota ? 'Editar Cuota' : 'Crear Cuota'}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <TextField
                  label="Unidad Habitacional"
                  name="unidad_habitacional"
                  value={formData.unidad_habitacional}
                  onChange={handleChange}
                  select
                  required
                  fullWidth
                >
                  {unidades.map((unidad) => (
                    <MenuItem key={unidad.id} value={unidad.id}>
                      {unidad.torre} - {unidad.piso} - {unidad.numero}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Monto"
                  name="monto"
                  type="number"
                  value={formData.monto}
                  onChange={handleChange}
                  required
                  fullWidth
                  inputProps={{ step: "0.01" }}
                />
                <TextField
                  label="Tipo"
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  select
                  required
                  fullWidth
                >
                  <MenuItem value="ordinaria">Ordinaria</MenuItem>
                  <MenuItem value="extraordinaria">Extraordinaria</MenuItem>
                  <MenuItem value="multa">Multa</MenuItem>
                </TextField>
                <TextField
                  label="Fecha de Vencimiento"
                  name="fecha_vencimiento"
                  type="date"
                  value={formData.fecha_vencimiento}
                  onChange={handleChange}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  select
                  required
                  fullWidth
                >
                  <MenuItem value="pendiente">Pendiente</MenuItem>
                  <MenuItem value="pagada">Pagada</MenuItem>
                  <MenuItem value="vencida">Vencida</MenuItem>
                </TextField>
                <TextField
                  label="Descripción"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  multiline
                  rows={3}
                  fullWidth
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancelar</Button>
              <Button type="submit" variant="contained">
                {editingCuota ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      ) : null}

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

export default CuotaList;