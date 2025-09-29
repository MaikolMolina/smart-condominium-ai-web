export const packagesConfig = [
  {
    id: 'identidad-unidades',
    nombre: 'Identidad & Unidades',
    icono: 'people',
    casosUso: [
      { id: 'cu1', nombre: 'Iniciar Sesión', ruta: '/login', componente: 'Login', implementado: true },
      { id: 'cu2', nombre: 'Cerrar Sesión', ruta: '/logout', componente: 'Logout', implementado: true },
      { id: 'cu3', nombre: 'Gestión de Usuarios', ruta: '/usuarios', componente: 'UserList', implementado: true },
      { id: 'cu4', nombre: 'Gestión de Roles', ruta: '/roles', componente: 'RoleList', implementado: true },
      { id: 'cu5', nombre: 'Gestión de Privilegios', ruta: '/privilegios', componente: 'PrivilegeList', implementado: true },
      { id: 'cu6', nombre: 'Gestión de Unidades', ruta: '/unidades', componente: 'UnidadList', implementado: true }
    ]
  },
  {
    id: 'finanzas-cobranza',
    nombre: 'Finanzas & Cobranza',
    icono: 'attach_money',
    casosUso: [
      { id: 'cu7', nombre: 'Gestión de Cuotas y Expensas', ruta: '/cuotas', componente: 'CuotaList', implementado: true },
      { id: 'cu8', nombre: 'Realizar Pago de Cuotas', ruta: '/pagos', componente: 'PagoList', implementado: false },
      { id: 'cu9', nombre: 'Ver Historial de Pagos', ruta: '/historial-pagos', componente: 'HistorialPagos', implementado: false },
      { id: 'cu19', nombre: 'Generar Reporte Financiero', ruta: '/reportes-financieros', componente: 'ReportesFinancieros', implementado: false },
      { id: 'cu24', nombre: 'Visualizar Morosidad', ruta: '/morosidad', componente: 'Morosidad', implementado: false },
      { id: 'cu26', nombre: 'Emitir QR de Pago', ruta: '/qr-pagos', componente: 'QRPagos', implementado: false }
    ]
  },
  {
    id: 'ia-seguridad',
    nombre: 'IA & Seguridad',
    icono: 'security',
    casosUso: [
      { id: 'cu12', nombre: 'Monitorear Cámaras', ruta: '/reconocimiento-facial', componente: 'ReconocimientoTiempoReal', implementado: true },
      { id: 'cu13', nombre: 'Monitor de Acceso Automático', ruta: '/monitor-acceso', componente: 'MonitorAccesoAutomatico', implementado: true },
      { id: 'cu14', nombre: 'Detectar Visitantes No Registrados', ruta: '/detectar-visitantes', componente: 'DetectarVisitantes', implementado: false },
      { id: 'cu15', nombre: 'Reconocer Vehículos', ruta: '/reconocimiento-vehiculos', componente: 'ReconocimientoVehiculos', implementado: false },
      { id: 'cu16', nombre: 'Detección de Anomalías', ruta: '/deteccion-anomalias', componente: 'DeteccionAnomalias', implementado: false },
      { id: 'cu17', nombre: 'Registro de Visitantes', ruta: '/registro-visitantes', componente: 'RegistroVisitantes', implementado: false },
      { id: 'cu20', nombre: 'Generar Reporte de Seguridad', ruta: '/reportes-seguridad', componente: 'ReportesSeguridad', implementado: false },
      { id: 'cu25', nombre: 'Gestión de Invitados', ruta: '/gestion-invitados', componente: 'InvitadoList', implementado: true  },
      { id: 'cu28', nombre: 'Registro de Rostros', ruta: '/registro-rostros', componente: 'RegistroRostro', implementado: true },
      { id: 'cu29', nombre: 'Gestión de Rostros', ruta: '/gestion-rostros', componente: 'GestionRostros', implementado: true },
      { id: 'cu30', nombre: 'Panel de Monitoreo', ruta: '/panel-monitoreo', componente: 'PanelMonitoreo', implementado: true },
    ]
  },
  {
    id: 'operaciones-notificaciones',
    nombre: 'Operaciones & Notificaciones',
    icono: 'notifications',
    casosUso: [
      { id: 'cu10', nombre: 'Gestión de Avisos', ruta: '/avisos', componente: 'Avisos', implementado: true },
      { id: 'cu18', nombre: 'Asignación de Tareas de Mantenimiento', ruta: '/tareas-mantenimiento', componente: 'TareasMantenimiento', implementado: false },
      { id: 'cu22', nombre: 'Generar Reporte de Mantenimiento', ruta: '/reportes-mantenimiento', componente: 'ReportesMantenimiento', implementado: false },
      { id: 'cu23', nombre: 'Enviar Notificaciones', ruta: '/notificaciones', componente: 'Notificaciones', implementado: false },
      { id: 'cu27', nombre: 'Registrar Bitacora', ruta: '/bitacora', componente: 'Configuracion', implementado: true },
      { id: 'cu11', nombre: 'Gestión de Áreas Comunes', ruta: '/areas-comunes', componente: 'AreasComunes', implementado: true },
      { id: 'cu21', nombre: 'Generar Reporte de Uso de Áreas', ruta: '/reportes-areas', componente: 'ReportesAreas', implementado: false }
    ]
  }
];

export const getPackageByRoute = (route) => {
  for (const pkg of packagesConfig) {
    if (pkg.casosUso.some(cu => cu.ruta === route)) {
      return pkg;
    }
  }
  return null;
};

export const getCasosUsoImplementados = () => {
  const implementados = [];
  packagesConfig.forEach(pkg => {
    pkg.casosUso.forEach(cu => {
      if (cu.implementado) {
        implementados.push(cu);
      }
    });
  });
  return implementados;
};