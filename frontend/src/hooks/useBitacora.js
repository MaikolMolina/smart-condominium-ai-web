// src/hooks/useBitacora.js
import { useEffect, useMemo, useState } from 'react';
import { getBitacora } from '../services/bitacoraService'; // usamos tu service

function buildQuery(paramsObj) {
  const params = {};
  Object.entries(paramsObj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params[k] = v;
  });
  return params;
}

export function useBitacora({
  page = 1,
  pageSize = 20,
  search = '',
  ordering = '-fecha',
  accion,
  metodo,
  status,
  usuario,
  fechaDesde,
  fechaHasta,
}) {
  const [state, setState] = useState({
    loading: false,
    error: null,
    data: [],
    count: 0,
    next: null,
    previous: null,
  });

  const queryParams = useMemo(() => buildQuery({
    page,
    page_size: pageSize,
    search,
    ordering,
    accion,
    metodo,
    status,
    usuario,
    fecha_desde: fechaDesde,
    fecha_hasta: fechaHasta,
  }), [page, pageSize, search, ordering, accion, metodo, status, usuario, fechaDesde, fechaHasta]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setState(s => ({ ...s, loading: true, error: null }));
      try {
        const res = await getBitacora(queryParams);
        if (cancelled) return;
        setState({
          loading: false,
          error: null,
          data: res.data.results || [],
          count: res.data.count || 0,
          next: res.data.next || null,
          previous: res.data.previous || null,
        });
      } catch (err) {
        if (cancelled) return;
        setState(s => ({ ...s, loading: false, error: err.message || 'Error' }));
      }
    })();
    return () => { cancelled = true; };
  }, [queryParams]);

  return { ...state, queryParams };
}
