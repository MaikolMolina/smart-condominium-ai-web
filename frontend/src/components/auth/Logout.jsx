import { useEffect } from 'react';

export default function Logout() {
  useEffect(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // Limpia cualquier otro estado que uses para auth
    window.location.replace('/login');
  }, []);

  return <div>Cerrando sesión…</div>;
}
