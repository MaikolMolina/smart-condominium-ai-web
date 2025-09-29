// src/components/avisos/AvisoList.js
import {
    Add as AddIcon,
    CheckCircle as ApproveIcon,
    Archive as ArchiveIcon,
    AttachFile as AttachIcon,
    Delete as DeleteIcon,
    Download as DownloadIcon,
    Edit as EditIcon,
    Publish as PublishIcon,
    Cancel as RejectIcon
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControlLabel,
    IconButton,
    MenuItem,
    Snackbar,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead, TableRow,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { usePrivileges } from '../../hooks/usePrivileges';
import { avisoService } from '../../services/avisoService';
import { unidadService } from '../../services/unidadService';

const ESTADOS = ['BORRADOR', 'PENDIENTE', 'PUBLICADO', 'ARCHIVADO', 'RECHAZADO'];
const VISIBILIDADES = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'SOLO_RESIDENTES', label: 'Solo residentes' },
  { value: 'SOLO_ADMIN', label: 'Solo administradores' },
  { value: 'POR_UNIDAD', label: 'Por unidad' },
];

const emptyForm = {
  titulo: '',
  contenido: '',
  requiere_aprobacion: false,
  visibilidad: 'TODOS',
  unidades_destino: [],
  vence_en: '',
};

const chipColor = (estado) => {
  switch (estado) {
    case 'PUBLICADO': return 'success';
    case 'PENDIENTE': return 'warning';
    case 'ARCHIVADO': return 'default';
    case 'RECHAZADO': return 'error';
    default: return 'info';
  }
};

const truncate = (s, n = 80) => (s ? (s.length > n ? s.slice(0, n) + '…' : s) : '—');

export default function AvisoList() {
  const [avisos, setAvisos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openDlg, setOpenDlg] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [unidades, setUnidades] = useState([]);

  // Archivos seleccionados en "Crear"
  const [stagedFiles, setStagedFiles] = useState([]); // File[]

  // Filtros (Solo vigentes activo por defecto)
  const [filters, setFilters] = useState({ q: '', estado: '', vigentes: true });

  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const { tienePrivilegio } = usePrivileges();

  const show = useCallback((message, severity = 'success') => setSnack({ open: true, message, severity }), []);
  const hide = () => setSnack({ ...snack, open: false });

  const loadUnidades = useCallback(async () => {
    try {
      const { data } = await unidadService.getAll();
      setUnidades(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadAvisos = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        q: filters.q || undefined,
        estado: filters.estado || undefined,
        vigentes: filters.vigentes ? 1 : undefined,
      };
      const { data } = await avisoService.list(params);
      setAvisos(data);
    } catch (e) {
      console.error(e);
      show('Error al cargar avisos', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, show]);

  useEffect(() => { loadUnidades(); }, [loadUnidades]);
  useEffect(() => { loadAvisos(); }, [loadAvisos]);

  const handleOpen = (aviso = null) => {
    if (aviso) {
      setEditing(aviso);
      setForm({
        titulo: aviso.titulo,
        contenido: aviso.contenido,
        requiere_aprobacion: aviso.requiere_aprobacion,
        visibilidad: aviso.visibilidad,
        unidades_destino: (aviso.unidades_destino || []).map(u => u.id ?? u),
        vence_en: aviso.vence_en ? aviso.vence_en.slice(0, 16) : '',
      });
    } else {
      setEditing(null);
      setForm(emptyForm);
    }
    setStagedFiles([]); // limpiar selección previa
    setOpenDlg(true);
  };

  const handleClose = () => {
    setOpenDlg(false);
    setStagedFiles([]);
  };

  const onChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const onCheck = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.checked }));

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        vence_en: form.vence_en ? new Date(form.vence_en).toISOString() : null,
      };

      if (editing) {
        await avisoService.update(editing.id, payload);
        show('Aviso actualizado');
      } else {
        // Crear y luego subir los adjuntos seleccionados
        const { data: created } = await avisoService.create(payload);
        if (stagedFiles.length) {
          for (const file of stagedFiles) {
            await avisoService.uploadAdjunto(created.id, file);
          }
        }
        show('Aviso creado');
      }

      handleClose();
      loadAvisos();
    } catch (err) {
      console.error(err);
      show('Error al guardar aviso', 'error');
    }
  };

  const del = async (id) => {
    if (!window.confirm('¿Eliminar este aviso?')) return;
    try {
      await avisoService.remove(id);
      show('Aviso eliminado');
      loadAvisos();
    } catch (e) {
      console.error(e);
      show('No se pudo eliminar', 'error');
    }
  };

  const call = async (fn, id, okMsg) => {
    try {
      await fn(id);
      show(okMsg);
      loadAvisos();
    } catch (e) {
      console.error(e);
      show('Operación no disponible', 'error');
    }
  };

  const canCreate = tienePrivilegio('avisos.create') || true;
  const canEdit = tienePrivilegio('avisos.edit') || true;
  const canDelete = tienePrivilegio('avisos.delete') || true;
  const canPublish = tienePrivilegio('avisos.publish') || true;
  const canArchive = tienePrivilegio('avisos.archive') || true;
  const canApprove = tienePrivilegio('avisos.approve') || true;

  // Adjuntos en EDICIÓN (sube al instante)
  const onUploadEdit = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    try {
      await avisoService.uploadAdjunto(editing.id, file);
      show('Adjunto subido');
      const { data } = await avisoService.get(editing.id);
      setEditing(data);
    } catch (err) {
      console.error(err);
      show('No se pudo subir el adjunto', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const removeAdjunto = async (adjId) => {
    if (!window.confirm('¿Eliminar adjunto?')) return;
    try {
      await avisoService.deleteAdjunto(adjId);
      show('Adjunto eliminado');
      const { data } = await avisoService.get(editing.id);
      setEditing(data);
    } catch (err) {
      console.error(err);
      show('Error al eliminar adjunto', 'error');
    }
  };

  // Adjuntos en CREAR (staging local)
  const onStageFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setStagedFiles(prev => [...prev, ...files]);
    e.target.value = '';
  };
  const removeStaged = (index) => {
    setStagedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const columns = useMemo(() => ([
    'Título', 'Contenido', 'Estado', 'Vence', 'Visibilidad', 'Acciones'
  ]), []);

  return (
    <Box>
      {/* Header + Filtros */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" sx={{ m: 0 }}>Operaciones & Notificaciones - Avisos</Typography>
        {canCreate && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
            Nuevo Aviso
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' }, gap: 1, mb: 2 }}>
        <TextField
          label="Buscar"
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && loadAvisos()}
        />
        <TextField
          select
          label="Estado"
          value={filters.estado}
          onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
        >
          <MenuItem value="">Todos</MenuItem>
          {ESTADOS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <FormControlLabel
          control={
            <Checkbox checked={filters.vigentes} onChange={(e) => setFilters({ ...filters, vigentes: e.target.checked })} />
          }
          label="Solo vigentes"
        />
      </Box>

      {/* Tabla */}
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="medium">
          <TableHead>
            <TableRow>
              {columns.map(c => <TableCell key={c}>{c}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && avisos.length === 0 && (
              <TableRow><TableCell colSpan={columns.length} align="center">No hay avisos</TableCell></TableRow>
            )}
            {avisos.map(a => (
              <TableRow key={a.id} hover>
                <TableCell>{a.titulo}</TableCell>
                <TableCell>
                  <Tooltip title={a.contenido || '—'} placement="top" arrow>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 420 }}>{truncate(a.contenido, 90)}</Typography>
                  </Tooltip>
                </TableCell>
                <TableCell><Chip size="small" label={a.estado} color={chipColor(a.estado)} /></TableCell>
                <TableCell>{a.vence_en ? new Date(a.vence_en).toLocaleString() : '—'}</TableCell>
                <TableCell>{VISIBILIDADES.find(v => v.value === a.visibilidad)?.label || a.visibilidad}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    {canEdit && (
                      <Tooltip title="Editar">
                        <IconButton color="primary" onClick={() => handleOpen(a)}><EditIcon /></IconButton>
                      </Tooltip>
                    )}
                    {canPublish && a.estado !== 'PUBLICADO' && a.estado !== 'ARCHIVADO' && (
                      <Tooltip title="Publicar">
                        <IconButton color="success" onClick={() => call(avisoService.publicar, a.id, 'Publicado')}>
                          <PublishIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canArchive && a.estado === 'PUBLICADO' && (
                      <Tooltip title="Archivar">
                        <IconButton color="default" onClick={() => call(avisoService.archivar, a.id, 'Archivado')}>
                          <ArchiveIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canApprove && a.requiere_aprobacion && a.estado === 'PENDIENTE' && (
                      <>
                        <Tooltip title="Aprobar (pasa a Borrador)">
                          <IconButton color="success" onClick={() => call(avisoService.aprobar, a.id, 'Aprobado')}>
                            <ApproveIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Rechazar">
                          <IconButton color="error" onClick={() => call(avisoService.rechazar, a.id, 'Rechazado')}>
                            <RejectIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    {canDelete && (
                      <Tooltip title="Eliminar">
                        <IconButton color="error" onClick={() => del(a.id)}><DeleteIcon /></IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {/* Dialog Crear/Editar */}
      <Dialog open={openDlg} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Editar Aviso' : 'Crear Aviso'}</DialogTitle>
        <form onSubmit={save}>
          <DialogContent dividers>
            <Box sx={{ display: 'grid', gap: 2 }}>
              <TextField
                name="titulo"
                label="Título *"
                value={form.titulo}
                onChange={onChange}
                required
                fullWidth
              />
              <TextField
                name="contenido"
                label="Contenido *"
                value={form.contenido}
                onChange={onChange}
                required
                fullWidth
                multiline
                minRows={3}
              />

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                <TextField
                  select
                  name="visibilidad"
                  label="Visibilidad"
                  value={form.visibilidad}
                  onChange={onChange}
                  fullWidth
                >
                  {VISIBILIDADES.map(v => (
                    <MenuItem key={v.value} value={v.value}>{v.label}</MenuItem>
                  ))}
                </TextField>

                <FormControlLabel
                  control={<Checkbox name="requiere_aprobacion" checked={form.requiere_aprobacion} onChange={onCheck} />}
                  label="Requiere aprobación"
                />
              </Stack>

              {form.visibilidad === 'POR_UNIDAD' && (
                <TextField
                  select
                  name="unidades_destino"
                  label="Unidades destino"
                  value={form.unidades_destino}
                  onChange={(e) => setForm({ ...form, unidades_destino: e.target.value })}
                  SelectProps={{ multiple: true }}
                  fullWidth
                >
                  {unidades.map(u => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.torre} - {u.piso} - {u.numero}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              <TextField
                name="vence_en"
                label="Vence en"
                type="datetime-local"
                value={form.vence_en}
                onChange={onChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <Divider />

              {/* Adjuntos */}
              <Typography variant="subtitle1">Adjuntos</Typography>

              {editing ? (
                <>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                    <Button variant="outlined" component="label" startIcon={<AttachIcon />}>
                      Subir archivo
                      <input type="file" hidden onChange={onUploadEdit} />
                    </Button>
                  </Stack>

                  <Stack spacing={1} sx={{ mt: 1 }}>
                    {(editing.adjuntos || []).map(adj => (
                      <Stack key={adj.id} direction="row" spacing={1} alignItems="center" sx={{ border: '1px solid #eee', p: 1, borderRadius: 1 }}>
                        <AttachIcon fontSize="small" />
                        <Typography variant="body2" sx={{ flex: 1 }}>{adj.nombre_original || 'archivo'}</Typography>
                        <Tooltip title="Descargar">
                          <IconButton size="small" onClick={() => window.open(adj.archivo, '_blank')}>
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton size="small" color="error" onClick={() => removeAdjunto(adj.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    ))}
                    {(editing.adjuntos || []).length === 0 && (
                      <Typography variant="body2" color="text.secondary">No hay adjuntos.</Typography>
                    )}
                  </Stack>
                </>
              ) : (
                <>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                    <Button variant="outlined" component="label" startIcon={<AttachIcon />}>
                      Seleccionar archivos
                      <input type="file" hidden multiple onChange={onStageFiles} />
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                      Se subirán al guardar el aviso.
                    </Typography>
                  </Stack>

                  <Stack spacing={1} sx={{ mt: 1 }}>
                    {stagedFiles.length === 0 && (
                      <Typography variant="body2" color="text.secondary">No hay archivos seleccionados.</Typography>
                    )}
                    {stagedFiles.map((f, i) => (
                      <Stack key={i} direction="row" spacing={1} alignItems="center" sx={{ border: '1px solid #eee', p: 1, borderRadius: 1 }}>
                        <AttachIcon fontSize="small" />
                        <Typography variant="body2" sx={{ flex: 1 }}>{f.name}</Typography>
                        <Tooltip title="Quitar">
                          <IconButton size="small" color="error" onClick={() => removeStaged(i)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    ))}
                  </Stack>
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancelar</Button>
            <Button type="submit" variant="contained">{editing ? 'Guardar cambios' : 'Crear'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4500} onClose={hide}>
        <Alert onClose={hide} severity={snack.severity} variant="filled">
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
