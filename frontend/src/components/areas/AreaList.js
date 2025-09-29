// src/components/areas/AreaList.js
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    RestoreFromTrash as RestoreIcon
} from "@mui/icons-material";
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    MenuItem,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableHead, TableRow,
    TextField,
    Tooltip,
    Typography
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import AreaService from "../../services/areaService";

import { usePrivileges as _usePrivileges } from "../../hooks/usePrivileges";

const usePrivileges = _usePrivileges ?? (() => ({ tienePrivilegio: () => true }));

const EMPTY = {
  nombre: "",
  descripcion: "",
  aforo_max: 1,
  requiere_aprobacion: false,
  hora_apertura: "",
  hora_cierre: "",
  max_duracion_min: 180,
  buffer_min: 0,
  activo: true
};


const truncate = (s, n = 80) => (s ? (s.length > n ? s.slice(0, n) + "…" : s) : "—");

export default function AreaList() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const { tienePrivilegio } = usePrivileges();

  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const loadAreas = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await AreaService.list();
      setAreas(data);
    } catch (e) {
      console.error(e);
      showSnackbar("Error al cargar áreas", "error");
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => { loadAreas(); }, [loadAreas]);

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const handleOpenDialog = async (area = null) => {
    if (area) {
      setEditingArea(area);
      setForm({
        ...area,
        hora_apertura: area.hora_apertura || "",
        hora_cierre: area.hora_cierre || ""
      });
    } else {
      setEditingArea(null);
      setForm(EMPTY);
    }
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);

  const validate = (payload) => {
    const e = {};
    if (!payload.nombre?.trim()) e.nombre = "El nombre es obligatorio";
    if ((payload.aforo_max ?? 0) < 1) e.aforo_max = "Aforo mínimo 1";
    if ((payload.max_duracion_min ?? 0) < 1) e.max_duracion_min = "Duración mínima 1";
    if ((payload.buffer_min ?? 0) < 0) e.buffer_min = "No puede ser negativo";
    return e;
  };

  const toNullIfEmpty = (v) => (v === "" ? null : v);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      hora_apertura: toNullIfEmpty(form.hora_apertura),
      hora_cierre: toNullIfEmpty(form.hora_cierre),
    };
    const eMap = validate(payload);
    setErrors(eMap);
    if (Object.keys(eMap).length) return;

    try {
      if (editingArea) {
        await AreaService.update(editingArea.id, payload);
        showSnackbar("Área actualizada correctamente");
      } else {
        await AreaService.create(payload);
        showSnackbar("Área creada correctamente");
      }
      handleCloseDialog();
      await loadAreas();
    } catch (error) {
      console.error(error);
      showSnackbar("Error al guardar el área", "error");
    }
  };

  // Baja lógica = toggle activo
  const handleToggleActivo = async (area) => {
    try {
      await AreaService.update(area.id, { ...area, activo: !area.activo });
      showSnackbar(area.activo ? "Área desactivada" : "Área activada");
      await loadAreas();
    } catch (error) {
      console.error(error);
      showSnackbar("No se pudo cambiar el estado del área", "error");
    }
  };

  return (
    <Box>
      {/* Encabezado */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Typography variant="h4" gutterBottom sx={{ m: 0 }}>
          Operaciones & Notificaciones - Gestión de Áreas Comunes
        </Typography>
        {tienePrivilegio("areas.create") && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Nueva Área
          </Button>
        )}
      </Box>

      {/* Tabla */}
      <Box sx={{ overflowX: "auto" }}>
        <Table size="medium">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Max Personas</TableCell>
              <TableCell>Horario</TableCell>
              <TableCell>Tiempo de Reserva (min)</TableCell>
              <TableCell>Tiempo de Transición (min)</TableCell>
              <TableCell>Aprobación</TableCell>
              <TableCell>Activa</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && areas.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center">Aún no hay áreas creadas.</TableCell>
              </TableRow>
            )}
            {areas.map((a) => (
              <TableRow key={a.id} hover>
                <TableCell>{a.nombre}</TableCell>
                <TableCell>
                  <Tooltip title={a.descripcion || "—"} placement="top" arrow>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 360 }}>
                      {truncate(a.descripcion, 60)}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>{a.aforo_max}</TableCell>
                <TableCell>{(a.hora_apertura || "-") + " - " + (a.hora_cierre || "-")}</TableCell>
                <TableCell>{a.max_duracion_min}</TableCell>
                <TableCell>{a.buffer_min}</TableCell>
                <TableCell>{a.requiere_aprobacion ? "Sí" : "No"}</TableCell>
                <TableCell>{a.activo ? "Sí" : "No"}</TableCell>
                <TableCell align="right">
                  {tienePrivilegio("areas.edit") && (
                    <Tooltip title="Editar">
                      <IconButton color="primary" onClick={() => handleOpenDialog(a)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {tienePrivilegio("areas.delete") && (
                    <Tooltip title={a.activo ? "Desactivar (baja lógica)" : "Activar"}>
                      <IconButton color={a.activo ? "error" : "success"} onClick={() => handleToggleActivo(a)}>
                        {a.activo ? <DeleteIcon /> : <RestoreIcon />}
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {/* Dialog Crear/Editar */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingArea ? "Editar Área" : "Crear Área"}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Box sx={{ display: "grid", gap: 2 }}>
              <TextField
                label="Nombre *"
                value={form.nombre}
                error={!!errors.nombre}
                helperText={errors.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Descripción"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                fullWidth
                multiline
                minRows={2}
              />

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                <TextField
                  label="Max Personas *" // antes: Aforo
                  type="number"
                  value={form.aforo_max}
                  error={!!errors.aforo_max}
                  helperText={errors.aforo_max}
                  onChange={(e) => setForm({ ...form, aforo_max: +e.target.value })}
                  fullWidth
                  inputProps={{ min: 1 }}
                  required
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.requiere_aprobacion}
                      onChange={(e) => setForm({ ...form, requiere_aprobacion: e.target.checked })}
                    />
                  }
                  label="Requiere aprobación"
                />
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                <TextField
                  label="Hora de apertura"
                  type="time"
                  value={form.hora_apertura || ""}
                  onChange={(e) => setForm({ ...form, hora_apertura: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Hora de cierre"
                  type="time"
                  value={form.hora_cierre || ""}
                  onChange={(e) => setForm({ ...form, hora_cierre: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                <TextField
                  label="Tiempo de Reserva (min) *" // antes: Duración máxima (min)
                  type="number"
                  value={form.max_duracion_min}
                  error={!!errors.max_duracion_min}
                  helperText={errors.max_duracion_min}
                  onChange={(e) => setForm({ ...form, max_duracion_min: +e.target.value })}
                  fullWidth
                  inputProps={{ min: 1 }}
                  required
                />
                <TextField
                  label="Tiempo de Transición (min)" // antes: Buffer (min)
                  type="number"
                  value={form.buffer_min}
                  error={!!errors.buffer_min}
                  helperText={errors.buffer_min}
                  onChange={(e) => setForm({ ...form, buffer_min: +e.target.value })}
                  fullWidth
                  inputProps={{ min: 0 }}
                />
              </Box>

              <TextField
                label="Estado"
                value={form.activo ? "Activa" : "Inactiva"}
                select
                onChange={(e) => setForm({ ...form, activo: e.target.value === "Activa" })}
                fullWidth
              >
                <MenuItem value="Activa">Activa</MenuItem>
                <MenuItem value="Inactiva">Inactiva</MenuItem>
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained">
              {editingArea ? "Guardar cambios" : "Crear"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4500} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
