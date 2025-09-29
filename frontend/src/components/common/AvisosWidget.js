// src/components/common/AvisosWidget.js
import { Info as InfoIcon } from '@mui/icons-material';
import {
    Button,
    Card, CardContent,
    Chip,
    Divider,
    IconButton,
    Skeleton,
    Stack,
    Tooltip,
    Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { avisoService } from '../../services/avisoService';

const chipColor = (estado) => {
  switch (estado) {
    case 'PUBLICADO': return 'success';
    case 'PENDIENTE': return 'warning';
    case 'ARCHIVADO': return 'default';
    case 'RECHAZADO': return 'error';
    default: return 'info';
  }
};

const isRecent = (isoDate, hours = 48) => {
  if (!isoDate) return false;
  const dt = new Date(isoDate).getTime();
  return Date.now() - dt < hours * 3600 * 1000;
};

export default function AvisosWidget({ maxItems = 5 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // Solo avisos vigentes (publicados y no vencidos)
        const { data } = await avisoService.list({ vigentes: 1 });
        if (!mounted) return;
        setItems(Array.isArray(data) ? data.slice(0, maxItems) : []);
      } catch (e) {
        console.error(e);
        if (mounted) setErr('No se pudieron cargar los avisos.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [maxItems]);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Typography variant="h6" sx={{ m: 0 }}>Avisos</Typography>
          <Button size="small" onClick={() => navigate('/avisos')}>Ver todos</Button>
        </Stack>

        <Divider sx={{ my: 1 }} />

        {loading ? (
          <Stack spacing={1}>
            {[...Array(3)].map((_, i) => (
              <Stack key={i} direction="row" spacing={1} alignItems="center">
                <Skeleton variant="rounded" width={64} height={24} />
                <Skeleton variant="text" sx={{ flex: 1 }} />
                <Skeleton variant="text" width={120} />
              </Stack>
            ))}
          </Stack>
        ) : err ? (
          <Typography variant="body2" color="error">{err}</Typography>
        ) : items.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No hay avisos vigentes.</Typography>
        ) : (
          <Stack spacing={1}>
            {items.map(a => (
              <Stack
                key={a.id}
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                sx={{
                  border: '1px solid #eee',
                  p: 1,
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.02)' }
                }}
                onClick={() => navigate('/avisos')}
              >
                <Chip size="small" label={a.estado} color={chipColor(a.estado)} />
                <Typography variant="body2" sx={{ flex: 1 }} noWrap title={a.titulo}>
                  {a.titulo}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 120, textAlign: { sm: 'right' } }}>
                  {a.vence_en ? new Date(a.vence_en).toLocaleString() : ''}
                </Typography>
                {isRecent(a.fecha_publicacion || a.creado_en) && (
                  <Tooltip title="Reciente">
                    <IconButton size="small"><InfoIcon fontSize="inherit" /></IconButton>
                  </Tooltip>
                )}
              </Stack>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
