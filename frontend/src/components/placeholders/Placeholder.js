import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { Construction as ConstructionIcon } from '@mui/icons-material';

const Placeholder = ({ titulo, descripcion, paquete }) => {
  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center', maxWidth: 600, mx: 'auto' }}>
        <ConstructionIcon sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom color="warning.main">
          {titulo}
        </Typography>
        <Typography variant="h6" gutterBottom>
          Funcionalidad en Desarrollo
        </Typography>
        <Typography variant="body1" paragraph>
          {descripcion}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Este módulo pertenece al paquete: <strong>{paquete}</strong>
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => window.history.back()}
        >
          Volver al Dashboard
        </Button>
      </Paper>
    </Box>
  );
};

export default Placeholder;