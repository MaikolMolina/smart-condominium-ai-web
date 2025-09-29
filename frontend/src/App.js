import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import Login from './components/auth/Login';
import Logout from './components/auth/Logout';

import Layout from './components/common/Layout';
import Dashboard from './pages/Dashboard';

// Módulos implementados
import BitacoraList from './components/bitacora/BitacoraList';
import CuotaList from './components/cuotas/CuotaList';
import InvitadoList from './components/invitados/InvitadoList';
import PrivilegeList from './components/privileges/PrivilegeList';
import GestionRostros from './components/reconocimiento-facial/GestionRostros';
import MonitorAccesoAutomatico from './components/reconocimiento-facial/MonitorAccesoAutomatico';
import PanelMonitoreo from './components/reconocimiento-facial/PanelMonitoreo';
import ReconocimientoTiempoReal from './components/reconocimiento-facial/ReconocimientoTiempoReal';
import RegistroRostro from './components/reconocimiento-facial/RegistroRostro';
import RoleList from './components/roles/RoleList';
import UnidadList from './components/unidades/UnidadList';
import UserList from './components/users/UserList';

// CU11 por si acaso
import AreaForm from './components/areas/AreaForm';
import AreaList from './components/areas/AreaList';
import ReservasList from './components/reservas/ReservasList';

//CU10 por si acaso
import AvisoList from './components/avisos/AvisoList';

import { AuthProvider, useAuth } from './contexts/AuthContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Público */}
      <Route path="/login" element={<Login />} />

      {/* Privado con Layout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* === Gestión de Usuarios/Roles/Privilegios === */}
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute>
            <Layout>
              <UserList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/roles"
        element={
          <ProtectedRoute>
            <Layout>
              <RoleList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/privilegios"
        element={
          <ProtectedRoute>
            <Layout>
              <PrivilegeList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/logout"
        element={
          <ProtectedRoute>
            <Layout>
              <Logout />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* === Unidades / Finanzas / Bitácora === */}
      <Route
        path="/unidades"
        element={
          <ProtectedRoute>
            <Layout>
              <UnidadList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cuotas"
        element={
          <ProtectedRoute>
            <Layout>
              <CuotaList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bitacora"
        element={
          <ProtectedRoute>
            <Layout>
              <BitacoraList />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* === CU11 – Áreas Comunes & Reservas === */}
      {/* Menú de paquetes: /areas-comunes */}
      <Route
        path="/areas-comunes"
        element={
          <ProtectedRoute>
            <Layout>
              <AreaList />
            </Layout>
          </ProtectedRoute>
        }
      />
      {/* Alias directo: /areas */}
      <Route
        path="/areas"
        element={
          <ProtectedRoute>
            <Layout>
              <AreaList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/areas/new"
        element={
          <ProtectedRoute>
            <Layout>
              <AreaForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/areas/:id/edit"
        element={
          <ProtectedRoute>
            <Layout>
              <AreaForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reservas"
        element={
          <ProtectedRoute>
            <Layout>
              <ReservasList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/reconocimiento-facial" element={
        <ProtectedRoute>
          <Layout>
            <ReconocimientoTiempoReal />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/registro-rostros" element={
        <ProtectedRoute>
          <Layout>
            <RegistroRostro />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/gestion-rostros" element={
        <ProtectedRoute>
          <Layout>
            <GestionRostros />
          </Layout>
        </ProtectedRoute>
      } />

      <Route
        path="/avisos"
        element={
          <ProtectedRoute>
            <Layout>
              <AvisoList />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/gestion-invitados"
        element={
          <ProtectedRoute>
            <Layout>
              <InvitadoList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/monitor-acceso" element={
        <ProtectedRoute>
          <Layout>
            <MonitorAccesoAutomatico />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/panel-monitoreo" element={
        <ProtectedRoute>
          <Layout>
            <PanelMonitoreo />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Home → Dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 */}
      <Route path="*" element={<div style={{ padding: 24 }}>404 - Recurso no encontrado</div>} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
