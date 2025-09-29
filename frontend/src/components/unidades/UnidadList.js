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
  Grid
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  //Home as HomeIcon
} from '@mui/icons-material';
import { unidadService } from '../../services/unidadService';
import { usePrivileges } from '../../hooks/usePrivileges';

const UnidadList = () => {
  const [unidades, setUnidades] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUnidad, setEditingUnidad] = useState(null);
  const [formData, setFormData] = useState({
    numero: '',
    piso: '',
    torre: '',
    metraje: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { tienePrivilegio } = usePrivileges();

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const loadUnidades = useCallback(async () => {
    try {
      const response = await unidadService.getAll();
      setUnidades(response.data);
    } catch (error) {
      console.error('Error loading unidades:', error);
      showSnackbar('Error al cargar unidades habitacionales', 'error');
    }
  }, [showSnackbar]);

  useEffect(() => {
    loadUnidades();
  }, [loadUnidades]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = (unidad = null) => {
    if (unidad) {
      setEditingUnidad(unidad);
      setFormData({
        numero: unidad.numero,
        piso: unidad.piso || '',
        torre: unidad.torre || '',
        metraje: unidad.metraje
      });
    } else {
      setEditingUnidad(null);
      setFormData({
        numero: '',
        piso: '',
        torre: '',
        metraje: ''
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
      if (editingUnidad) {
        await unidadService.update(editingUnidad.id, formData);
        showSnackbar('Unidad actualizada correctamente');
      } else {
        await unidadService.create(formData);
        showSnackbar('Unidad creada correctamente');
      }
      loadUnidades();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving unidad:', error);
      showSnackbar('Error al guardar unidad', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta unidad?')) {
      try {
        await unidadService.delete(id);
        showSnackbar('Unidad eliminada correctamente');
        loadUnidades();
      } catch (error) {
        console.error('Error deleting unidad:', error);
        showSnackbar('Error al eliminar unidad', 'error');
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Gestión de Unidades Habitacionales
        </Typography>
        {tienePrivilegio('units.create') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nueva Unidad
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {unidades.map((unidad) => (
          <Grid item xs={12} sm={6} md={4} key={unidad.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Unidad: {unidad.numero}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Torre: {unidad.torre || 'N/A'} - Piso: {unidad.piso || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Metraje: {unidad.metraje} m²
                    </Typography>
                  </Box>
                  <Box>
                    {tienePrivilegio('units.edit') && (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(unidad)}
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                    {tienePrivilegio('units.delete') && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(unidad.id)}
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

      {tienePrivilegio('units.create') || tienePrivilegio('units.edit') ? (
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingUnidad ? 'Editar Unidad' : 'Crear Unidad'}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <TextField
                  label="Número"
                  name="numero"
                  value={formData.numero}
                  onChange={handleChange}
                  required
                  fullWidth
                />
                <TextField
                  label="Torre"
                  name="torre"
                  value={formData.torre}
                  onChange={handleChange}
                  fullWidth
                />
                <TextField
                  label="Piso"
                  name="piso"
                  value={formData.piso}
                  onChange={handleChange}
                  fullWidth
                />
                <TextField
                  label="Metraje (m²)"
                  name="metraje"
                  type="number"
                  value={formData.metraje}
                  onChange={handleChange}
                  required
                  fullWidth
                  inputProps={{ step: "0.01" }}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancelar</Button>
              <Button type="submit" variant="contained">
                {editingUnidad ? 'Actualizar' : 'Crear'}
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

export default UnidadList;