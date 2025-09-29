// === imports unificados y sin duplicados ===
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  AppBar,
  Avatar,
  Box,
  Chip,
  Collapse,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography
} from '@mui/material';

import {
  Dashboard as DashboardIcon,
  ExitToApp as ExitToAppIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Menu as MenuIcon
} from '@mui/icons-material';

import { getPackageByRoute, packagesConfig } from '../../config/packages';
import { useAuth } from '../../contexts/AuthContext';


const drawerWidth = 280;

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [paquetesAbiertos, setPaquetesAbiertos] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
    navigate('/login');
  };

  const togglePaquete = (paqueteId) => {
    setPaquetesAbiertos(prev => ({
      ...prev,
      [paqueteId]: !prev[paqueteId]
    }));
  };

  const handleNavigation = (ruta) => {
    navigate(ruta);
    // Cerrar el drawer en móviles después de navegar
    if (window.innerWidth < 600) {
      setMobileOpen(false);
    }
  };

  const paqueteActual = getPackageByRoute(location.pathname);

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Smart Condo
        </Typography>
      </Toolbar>
      
      <List>
        {/* Dashboard */}
        <ListItem disablePadding>
          <ListItemButton
            selected={location.pathname === '/dashboard'}
            onClick={() => handleNavigation('/dashboard')}
          >
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>

        {/* Paquetes */}
        {packagesConfig.map((paquete) => {
          const casosUsoImplementados = paquete.casosUso.filter(cu => cu.implementado);
          const estaAbierto = paquetesAbiertos[paquete.id] || false;
          const tieneRutaActiva = paquete.casosUso.some(cu => cu.ruta === location.pathname);

          return (
            <React.Fragment key={paquete.id}>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => togglePaquete(paquete.id)}
                  selected={tieneRutaActiva}
                >
                  <ListItemIcon>
                    {(() => {
                      switch(paquete.icono) {
                        case 'people': return <DashboardIcon />;
                        case 'attach_money': return <DashboardIcon />;
                        case 'security': return <DashboardIcon />;
                        case 'notifications': return <DashboardIcon />;
                        default: return <DashboardIcon />;
                      }
                    })()}
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ flexGrow: 1 }}>
                          {paquete.nombre}
                        </Typography>
                        <Chip 
                          label={casosUsoImplementados.length}
                          size="small"
                          color={casosUsoImplementados.length === paquete.casosUso.length ? 'success' : 'primary'}
                        />
                      </Box>
                    } 
                  />
                  {estaAbierto ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </ListItemButton>
              </ListItem>
              
              <Collapse in={estaAbierto} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {paquete.casosUso.map((casoUso) => (
                    <ListItemButton
                      key={casoUso.id}
                      sx={{ pl: 4 }}
                      selected={location.pathname === casoUso.ruta}
                      onClick={() => handleNavigation(casoUso.ruta)}
                      disabled={!casoUso.implementado}
                    >
                      <ListItemText 
                        primary={
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              opacity: casoUso.implementado ? 1 : 0.5,
                              fontStyle: casoUso.implementado ? 'normal' : 'italic'
                            }}
                          >
                            {casoUso.nombre}
                            {!casoUso.implementado && ' (Próximamente)'}
                          </Typography>
                        } 
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            </React.Fragment>
          );
        })}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {paqueteActual ? `${paqueteActual.nombre} - ${paqueteActual.casosUso.find(cu => cu.ruta === location.pathname)?.nombre || ''}` : 'Smart Condominium'}
          </Typography>
          <div>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {currentUser?.first_name?.[0]}{currentUser?.last_name?.[0]}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleClose}>Perfil</MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <ExitToAppIcon fontSize="small" />
                </ListItemIcon>
                Cerrar Sesión
              </MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;