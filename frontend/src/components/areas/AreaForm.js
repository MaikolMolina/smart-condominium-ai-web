// src/components/areas/AreaForm.js
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AreaService from "../../services/areaService";

export default function AreaForm() {
  const nav = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    aforo_max: 1,
    requiere_aprobacion: false,
    hora_apertura: "",
    hora_cierre: "",
    max_duracion_min: 180,
    buffer_min: 0,
    activo: true
  });

  useEffect(() => {
    if (isEdit) {
      AreaService.get(id).then(({ data }) => setForm({
        ...data,
        hora_apertura: data.hora_apertura || "",
        hora_cierre: data.hora_cierre || ""
      }));
    }
  }, [id]);

  const submit = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (payload.hora_apertura === "") payload.hora_apertura = null;
    if (payload.hora_cierre === "") payload.hora_cierre = null;

    if (isEdit) await AreaService.update(id, payload);
    else await AreaService.create(payload);
    nav("/areas");
  };

  return (
    <div className="container">
      <h2>{isEdit ? "Editar Área" : "Nueva Área"}</h2>
      <form onSubmit={submit} style={{display:"grid", gap:12, maxWidth:720}}>
        <input required placeholder="Nombre"
          value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})}/>
        <textarea placeholder="Descripción"
          value={form.descripcion} onChange={e=>setForm({...form, descripcion:e.target.value})}/>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
          <label>Aforo
            <input type="number" min={1} value={form.aforo_max}
              onChange={e=>setForm({...form, aforo_max:+e.target.value})}/>
          </label>
          <label>Requiere aprobación
            <input type="checkbox" checked={form.requiere_aprobacion}
              onChange={e=>setForm({...form, requiere_aprobacion:e.target.checked})}/>
          </label>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
          <label>Hora apertura
            <input type="time" value={form.hora_apertura||""}
              onChange={e=>setForm({...form, hora_apertura:e.target.value})}/>
          </label>
          <label>Hora cierre
            <input type="time" value={form.hora_cierre||""}
              onChange={e=>setForm({...form, hora_cierre:e.target.value})}/>
          </label>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
          <label>Max duración (min)
            <input type="number" min={1} value={form.max_duracion_min}
              onChange={e=>setForm({...form, max_duracion_min:+e.target.value})}/>
          </label>
          <label>Buffer (min)
            <input type="number" min={0} value={form.buffer_min}
              onChange={e=>setForm({...form, buffer_min:+e.target.value})}/>
          </label>
        </div>
        <label>Activa
          <input type="checkbox" checked={form.activo}
            onChange={e=>setForm({...form, activo:e.target.checked})}/>
        </label>
        <div style={{display:"flex", gap:12}}>
          <button type="submit" className="btn btn-primary">Guardar</button>
          <button type="button" className="btn" onClick={()=>nav("/areas")}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}
