//import { useContext } from 'react';
//import { AuthContext } from '../contexts/AuthContext';
import { useAuth } from '../contexts/AuthContext';

export const usePrivileges = () => {
  //const { currentUser, userPrivileges } = useContext(AuthContext);
  const { currentUser, userPrivileges } = useAuth();

  const tienePrivilegio = (codigoPrivilegio) => {
    if (!currentUser) return false;
    
    // Superusuarios tienen todos los privilegios
    if (currentUser.is_superuser) return true;
    
    // Verificar si el usuario tiene el privilegio 
    return userPrivileges.includes(codigoPrivilegio);
  };

  return { tienePrivilegio };
};