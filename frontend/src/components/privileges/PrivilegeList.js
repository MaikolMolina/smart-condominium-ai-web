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
  Add as AddIcon
} from '@mui/icons-material';
import { privilegeService } from '../../services/privilegeService';
import { usePrivileges } from '../../hooks/usePrivileges';

const PrivilegeList = () => {
  const [privileges, setPrivileges] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPrivilege, setEditingPrivilege] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    codigo: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { tienePrivilegio } = usePrivileges();

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const loadPrivileges = useCallback(async () => {
    try {
      const response = await privilegeService.getAll();
      setPrivileges(response.data);
    } catch (error) {
      console.error('Error loading privileges:', error);
      showSnackbar('Error al cargar privilegios', 'error');
    }
  }, [showSnackbar]);

  useEffect(() => {
    loadPrivileges();
  }, [loadPrivileges]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = (privilege = null) => {
    if (privilege) {
      setEditingPrivilege(privilege);
      setFormData({
        nombre: privilege.nombre,
        descripcion: privilege.descripcion || '',
        codigo: privilege.codigo
      });
    } else {
      setEditingPrivilege(null);
      setFormData({
        nombre: '',
        descripcion: '',
        codigo: ''
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
      if (editingPrivilege) {
        await privilegeService.update(editingPrivilege.id, formData);
        showSnackbar('Privilegio actualizado correctamente');
      } else {
        await privilegeService.create(formData);
        showSnackbar('Privilegio creado correctamente');
      }
      loadPrivileges();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving privilege:', error);
      showSnackbar('Error al guardar privilegio', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este privilegio?')) {
      try {
        await privilegeService.delete(id);
        showSnackbar('Privilegio eliminado correctamente');
        loadPrivileges();
      } catch (error) {
        console.error('Error deleting privilege:', error);
        showSnackbar('Error al eliminar privilegio', 'error');
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Gestión de Privilegios
        </Typography>
        {tienePrivilegio('privileges.create') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nuevo Privilegio
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {privileges.map((privilege) => (
          <Grid item xs={12} sm={6} md={4} key={privilege.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {privilege.nombre}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Código: {privilege.codigo}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {privilege.descripcion || 'Sin descripción'}
                    </Typography>
                  </Box>
                  <Box>
                    {tienePrivilegio('privileges.edit') && (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(privilege)}
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                    {tienePrivilegio('privileges.delete') && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(privilege.id)}
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

      {tienePrivilegio('privileges.create') || tienePrivilegio('privileges.edit') ? (
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingPrivilege ? 'Editar Privilegio' : 'Crear Privilegio'}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <TextField
                  label="Nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  fullWidth
                />
                <TextField
                  label="Código"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleChange}
                  required
                  fullWidth
                  helperText="Código único para identificar el privilegio en el sistema"
                />
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
                {editingPrivilege ? 'Actualizar' : 'Crear'}
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

export default PrivilegeList;