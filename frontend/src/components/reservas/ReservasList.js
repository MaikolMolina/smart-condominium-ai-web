// src/components/reservas/ReservasList.js
import { useEffect, useState } from "react";
import AreaService from "../../services/areaService";
import ReservaService from "../../services/reservaService";

export default function ReservasList(){
  const [areas, setAreas] = useState([]);
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ area:"", inicio:"", fin:"", asistentes:1, motivo:"" });
  const [loading, setLoading] = useState(true);

  const load = async ()=>{
    setLoading(true);
    const [a, r] = await Promise.all([AreaService.list(), ReservaService.listMine()]);
    setAreas(a.data); setList(r.data); setLoading(false);
  };

  useEffect(()=>{ load(); },[]);

  const crear = async (e)=>{
    e.preventDefault();
    await ReservaService.create(form);
    setForm({ area:"", inicio:"", fin:"", asistentes:1, motivo:"" });
    await load();
  };

  const cancelar = async (id)=>{
    await ReservaService.cancelar(id);
    await load();
  };

  if (loading) return <p>Cargando reservas...</p>;

  return (
    <div className="container">
      <h2>Mis Reservas</h2>
      <form onSubmit={crear} style={{display:"grid", gap:8, maxWidth:600}}>
        <select value={form.area} onChange={e=>setForm({...form, area:+e.target.value})} required>
          <option value="">-- Área --</option>
          {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
        <input type="datetime-local" value={form.inicio} onChange={e=>setForm({...form, inicio:e.target.value})} required />
        <input type="datetime-local" value={form.fin} onChange={e=>setForm({...form, fin:e.target.value})} required />
        <input type="number" min={1} value={form.asistentes} onChange={e=>setForm({...form, asistentes:+e.target.value})}/>
        <input placeholder="Motivo (opcional)" value={form.motivo} onChange={e=>setForm({...form, motivo:e.target.value})}/>
        <button type="submit" className="btn btn-primary">Reservar</button>
      </form>

      <h3 style={{marginTop:24}}>Listado</h3>
      <table className="table">
        <thead>
          <tr><th>Área</th><th>Inicio</th><th>Fin</th><th>Asistentes</th><th>Estado</th><th></th></tr>
        </thead>
        <tbody>
          {list.map(r=>(
            <tr key={r.id}>
              <td>{r.area_nombre}</td>
              <td>{new Date(r.inicio).toLocaleString()}</td>
              <td>{new Date(r.fin).toLocaleString()}</td>
              <td>{r.asistentes}</td>
              <td>{r.estado}</td>
              <td>
                {r.estado !== "CANCELADA" && (
                  <button className="btn btn-outline" onClick={()=>cancelar(r.id)}>Cancelar</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
