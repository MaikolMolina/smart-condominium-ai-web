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
  Chip,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { roleService } from '../../services/roleService';
import { privilegeService } from '../../services/privilegeService';
import { usePrivileges } from '../../hooks/usePrivileges';

const RoleList = () => {
  const [roles, setRoles] = useState([]);
  const [privileges, setPrivileges] = useState([]);
  const [rolePrivileges, setRolePrivileges] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [openPrivilegeDialog, setOpenPrivilegeDialog] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { tienePrivilegio } = usePrivileges();

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const loadRoles = useCallback(async () => {
    try {
      const response = await roleService.getAll();
      setRoles(response.data);
    } catch (error) {
      console.error('Error loading roles:', error);
      showSnackbar('Error al cargar roles', 'error');
    }
  }, [showSnackbar]);

  const loadPrivileges = useCallback(async () => {
    try {
      const response = await privilegeService.getAll();
      setPrivileges(response.data);
    } catch (error) {
      console.error('Error loading privileges:', error);
      showSnackbar('Error al cargar privilegios', 'error');
    }
  }, [showSnackbar]);

  const loadRolePrivileges = useCallback(async (roleId) => {
    try {
      const response = await roleService.getPrivileges(roleId);
      setRolePrivileges(prev => ({
        ...prev,
        [roleId]: response.data
      }));
    } catch (error) {
      console.error('Error loading role privileges:', error);
    }
  }, []);

  useEffect(() => {
    loadRoles();
    loadPrivileges();
  }, [loadRoles, loadPrivileges]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = (role = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        nombre: role.nombre,
        descripcion: role.descripcion || ''
      });
    } else {
      setEditingRole(null);
      setFormData({
        nombre: '',
        descripcion: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenPrivilegeDialog = (role) => {
    if (!tienePrivilegio('roles.edit')) return;
    
    setSelectedRole(role);
    if (!rolePrivileges[role.id]) {
      loadRolePrivileges(role.id);
    }
    setOpenPrivilegeDialog(true);
  };

  const handleClosePrivilegeDialog = () => {
    setOpenPrivilegeDialog(false);
    setSelectedRole(null);
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
      if (editingRole) {
        await roleService.update(editingRole.id, formData);
        showSnackbar('Rol actualizado correctamente');
      } else {
        await roleService.create(formData);
        showSnackbar('Rol creado correctamente');
      }
      loadRoles();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving role:', error);
      showSnackbar('Error al guardar rol', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este rol?')) {
      try {
        await roleService.delete(id);
        showSnackbar('Rol eliminado correctamente');
        loadRoles();
      } catch (error) {
        console.error('Error deleting role:', error);
        showSnackbar('Error al eliminar rol', 'error');
      }
    }
  };

  const handleAssignPrivilege = async (privilegeId) => {
    try {
      await roleService.assignPrivilege(selectedRole.id, privilegeId);
      showSnackbar('Privilegio asignado correctamente');
      loadRolePrivileges(selectedRole.id);
    } catch (error) {
      console.error('Error assigning privilege:', error);
      showSnackbar('Error al asignar privilegio', 'error');
    }
  };

  const handleRemovePrivilege = async (privilegeId) => {
    try {
      await roleService.removePrivilege(selectedRole.id, privilegeId);
      showSnackbar('Privilegio removido correctamente');
      loadRolePrivileges(selectedRole.id);
    } catch (error) {
      console.error('Error removing privilege:', error);
      showSnackbar('Error al remover privilegio', 'error');
    }
  };

  const isPrivilegeAssigned = (privilegeId) => {
    if (!selectedRole || !rolePrivileges[selectedRole.id]) return false;
    return rolePrivileges[selectedRole.id].some(p => p.id === privilegeId);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Gestión de Roles
        </Typography>
        {tienePrivilegio('roles.create') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nuevo Rol
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {roles.map((role) => (
          <Grid item xs={12} sm={6} md={4} key={role.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {role.nombre}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {role.descripcion || 'Sin descripción'}
                    </Typography>
                  </Box>
                  <Box>
                    {tienePrivilegio('roles.edit') && (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(role)}
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                    {tienePrivilegio('roles.delete') && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(role.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                </Box>
                {tienePrivilegio('roles.edit') && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<SecurityIcon />}
                    onClick={() => handleOpenPrivilegeDialog(role)}
                    sx={{ mt: 1 }}
                  >
                    Gestionar Privilegios
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {tienePrivilegio('roles.create') || tienePrivilegio('roles.edit') ? (
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingRole ? 'Editar Rol' : 'Crear Rol'}
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
                {editingRole ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      ) : null}

      <Dialog 
        open={openPrivilegeDialog} 
        onClose={handleClosePrivilegeDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Privilegios del Rol: {selectedRole?.nombre}
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            Privilegios asignados:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
            {selectedRole && rolePrivileges[selectedRole.id]?.map((privilege) => (
              <Chip
                key={privilege.id}
                label={privilege.nombre}
                onDelete={() => handleRemovePrivilege(privilege.id)}
                color="primary"
                variant="outlined"
              />
            ))}
            {selectedRole && (!rolePrivileges[selectedRole.id] || rolePrivileges[selectedRole.id].length === 0) && (
              <Typography variant="body2" color="textSecondary">
                No hay privilegios asignados
              </Typography>
            )}
          </Box>

          <Typography variant="subtitle1" gutterBottom>
            Todos los privilegios disponibles:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {privileges.map((privilege) => (
              <Chip
                key={privilege.id}
                label={privilege.nombre}
                onClick={() => handleAssignPrivilege(privilege.id)}
                color={isPrivilegeAssigned(privilege.id) ? "primary" : "default"}
                variant={isPrivilegeAssigned(privilege.id) ? "filled" : "outlined"}
                disabled={isPrivilegeAssigned(privilege.id)}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePrivilegeDialog}>Cerrar</Button>
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

export default RoleList;