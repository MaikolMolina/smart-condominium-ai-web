from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminOrReadOnly(BasePermission):
    """
    - Métodos de lectura (GET/HEAD/OPTIONS): requieren usuario autenticado.
    - Métodos de escritura (POST/PUT/PATCH/DELETE): solo admin (is_staff).
    """

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if request.method in SAFE_METHODS:
            return bool(user and user.is_authenticated)
        return bool(user and user.is_authenticated and user.is_staff)


class TienePrivilegio(BasePermission):
    """
    Permiso tolerante a errores para vistas que definan `view.privilegio_requerido`.

    - superuser => permitido.
    - si la vista NO define privilegio => permitido (no bloquea accidentalmente).
    - intenta resolver por `user.roles` (M2M) o por `user.rol` (FK) si existe.
    - si no puede determinar privilegios => deniega (False), pero NUNCA lanza excepción.
    """

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False

        # superuser siempre pasa
        if getattr(user, "is_superuser", False):
            return True

        code = getattr(view, "privilegio_requerido", None)

        # Si la vista no pide privilegio explícito, no bloqueamos
        if not code:
            return True

        # Intenta por M2M: user.roles
        try:
            roles_qs = getattr(user, "roles", None)
            if roles_qs is not None and hasattr(roles_qs, "filter"):
                return roles_qs.filter(privilegios__codigo=code).exists()
        except Exception:
            pass

        # Intenta por FK: user.rol
        try:
            rol = getattr(user, "rol", None)
            if rol and hasattr(rol, "privilegios"):
                return rol.privilegios.filter(codigo=code).exists()
        except Exception:
            pass

        # Fallback: denegar sin romper
        return False
