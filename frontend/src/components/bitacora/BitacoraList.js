
// src/components/bitacora/BitacoraList.js
import { Clear as ClearIcon, Download as DownloadIcon, Sort as SortIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useBitacora } from '../../hooks/useBitacora';


// 🔧 NUEVO: helper para evaluar vacío
//const isEmptyValue = (v) => v === null || v === undefined || v === "" || v === "-";

// ---- util: debounce
function useDebouncedValue(value, delay = 450) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return v;
}

// ---- export CSV
function exportCSV(rows, filename = 'bitacora.csv') {
  if (!rows?.length) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map(obj =>
      headers.map(h => {
        let val = obj[h];
        if (val === null || val === undefined) val = '';
        val = String(val).replace(/"/g, '""');
        if (val.includes(',') || val.includes('"') || val.includes('\n')) val = `"${val}"`;
        return val;
      }).join(',')
    )
  ];
  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---- columnas
const columns = [
  { key: 'fecha', label: 'Fecha/Hora' },
  { key: 'usuario', label: 'Usuario' },
  { key: 'rol', label: 'Rol' },
  { key: 'accion', label: 'Acción' },
  { key: 'entidad', label: 'Entidad' },
  { key: 'entidad_id', label: 'Entidad ID' },
  { key: 'metodo', label: 'Método' },
  { key: 'ruta', label: 'Ruta' },
  { key: 'status', label: 'Status' },
  { key: 'ip', label: 'IP' },
  { key: 'user_agent', label: 'User Agent' },
];

// visibilidad por breakpoint (ocultamos columnas de baja prioridad en pantallas chicas)
const COL_VIS = {
  rol:        { display: { xs: 'none', md: 'table-cell' } },
  entidad:    { display: { xs: 'none', lg: 'table-cell' } },
  entidad_id: { display: { xs: 'none', lg: 'table-cell' } },
  ruta:       { display: { xs: 'none', sm: 'table-cell' } },
  ip:         { display: { xs: 'none', xl: 'table-cell' } },
  user_agent: { display: { xs: 'none', xl: 'table-cell' } },
};

export default function BitacoraList() {
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm')); // < 600px

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [ordering, setOrdering] = useState('-fecha');

  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 450);

  const [accion, setAccion] = useState('');
  const [metodo, setMetodo] = useState('');
  const [status, setStatus] = useState('');
  const [usuario, setUsuario] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const { data, count, loading, error } = useBitacora({
    page, pageSize, search, ordering,
    accion, metodo, status, usuario, fechaDesde, fechaHasta,
  });

  const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize));
  const currentSortKey = useMemo(() => ordering.replace('-', ''), [ordering]);
  const currentSortDir = useMemo(() => (ordering.startsWith('-') ? 'desc' : 'asc'), [ordering]);

  const toggleSort = (field) => {
    setPage(1);
    setOrdering(prev => {
      if (prev === field) return `-${field}`;
      if (prev === `-${field}`) return field;
      return field;
    });
  };

  const clearFilters = () => {
    setPage(1);
    setSearchInput('');
    setAccion(''); setMetodo(''); setStatus('');
    setUsuario(''); setFechaDesde(''); setFechaHasta('');
    setOrdering('-fecha');
  };

  return (
    <Box>
      <Typography variant={isSmDown ? 'h5' : 'h4'} gutterBottom>Bitácora</Typography>

      <Paper sx={{ p: isSmDown ? 1.5 : 2, mb: 2 }}>
        <Grid container spacing={1.5}>
          <Grid item xs={12} md={4}>
            <TextField
              size={isSmDown ? 'small' : 'medium'}
              label="Buscar (ruta, entidad, user_agent, etc.)"
              value={searchInput}
              onChange={e => { setPage(1); setSearchInput(e.target.value); }}
              fullWidth
            />
          </Grid>

          <Grid item xs={6} md={2}>
            <FormControl fullWidth size={isSmDown ? 'small' : 'medium'}>
              <InputLabel>Acción</InputLabel>
              <Select
                label="Acción"
                value={accion}
                onChange={e => { setPage(1); setAccion(e.target.value); }}
              >
                <MenuItem value="">(todas)</MenuItem>
                {['LOGIN','LOGOUT','CREATE','READ','UPDATE','DELETE','ACCESO','CERRAR SESIÓN','BORRAR','CREAR','ACTUALIZAR'].map(a => (
                  <MenuItem key={a} value={a}>{a}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={2}>
            <FormControl fullWidth size={isSmDown ? 'small' : 'medium'}>
              <InputLabel>Método</InputLabel>
              <Select
                label="Método"
                value={metodo}
                onChange={e => { setPage(1); setMetodo(e.target.value); }}
              >
                <MenuItem value="">(todos)</MenuItem>
                {['GET','POST','PUT','PATCH','DELETE'].map(m => (
                  <MenuItem key={m} value={m}>{m}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={2}>
            <TextField
              size={isSmDown ? 'small' : 'medium'}
              label="Status"
              type="number"
              value={status}
              onChange={e => { setPage(1); setStatus(e.target.value); }}
              fullWidth
            />
          </Grid>

          <Grid item xs={6} md={2}>
            <TextField
              size={isSmDown ? 'small' : 'medium'}
              label="Usuario"
              value={usuario}
              onChange={e => { setPage(1); setUsuario(e.target.value); }}
              fullWidth
            />
          </Grid>

          <Grid item xs={6} md={2}>
            <TextField
              size={isSmDown ? 'small' : 'medium'}
              label="Desde"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={fechaDesde}
              onChange={e => { setPage(1); setFechaDesde(e.target.value); }}
              fullWidth
            />
          </Grid>

          <Grid item xs={6} md={2}>
            <TextField
              size={isSmDown ? 'small' : 'medium'}
              label="Hasta"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={fechaHasta}
              onChange={e => { setPage(1); setFechaHasta(e.target.value); }}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md="auto" display="flex" alignItems="center" gap={1}>
            <Button variant="outlined" startIcon={<ClearIcon />} onClick={clearFilters}>
              Limpiar
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => exportCSV(data)}
              disabled={!data?.length}
            >
              Exportar CSV
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table size={isSmDown ? 'small' : 'medium'}>
          <TableHead>
            <TableRow>
              {columns.map(col => (
                <TableCell
                  key={col.key}
                  sx={{
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    ...(COL_VIS[col.key] || {})
                  }}
                  onClick={() => toggleSort(col.key)}
                >
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    {col.label}
                    <Tooltip title="Ordenar">
                      <IconButton size="small">
                        <SortIcon
                          fontSize="inherit"
                          color={currentSortKey === col.key ? 'primary' : 'disabled'}
                          style={{ transform: currentSortKey === col.key && currentSortDir === 'desc' ? 'rotate(180deg)' : 'none' }}
                        />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {!loading && data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">Sin resultados</TableCell>
              </TableRow>
            )}

            {data?.map(row => (
              <TableRow key={row.id}>
                <TableCell>{new Date(row.fecha).toLocaleString()}</TableCell>
                <TableCell>{row.usuario || '-'}</TableCell>
                <TableCell sx={COL_VIS.rol}>{row.rol || '-'}</TableCell>
                <TableCell>{row.accion || '-'}</TableCell>
                <TableCell sx={COL_VIS.entidad}>{row.entidad || '-'}</TableCell>
                <TableCell sx={COL_VIS.entidad_id}>{row.entidad_id || '-'}</TableCell>
                <TableCell><span translate="no">{row.metodo || '-'}</span></TableCell>
                <TableCell
                  title={row.ruta}
                  sx={{ ...COL_VIS.ruta, maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  {row.ruta || '-'}
                </TableCell>
                <TableCell>{row.status ?? '-'}</TableCell>
                <TableCell sx={COL_VIS.ip}>{row.ip || '-'}</TableCell>
                <TableCell
                  title={row.user_agent}
                  sx={{ ...COL_VIS.user_agent, maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  {row.user_agent || '-'}
                </TableCell>
              </TableRow>
            ))}

            {loading && (
              <TableRow>
                <TableCell colSpan={columns.length}>Cargando…</TableCell>
              </TableRow>
            )}
            {error && (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ color: 'error.main' }}>
                  Error: {error}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
        <Typography variant="body2">Total: {count ?? 0}</Typography>
        <Pagination
          page={page}
          onChange={(_, p) => setPage(p)}
          count={totalPages}
          color="primary"
          showFirstButton
          showLastButton
        />
      </Box>
    </Box>
  );
}