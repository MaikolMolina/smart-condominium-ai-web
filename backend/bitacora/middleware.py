##bitacora / middleware.py

from django.conf import settings
from django.utils.deprecation import MiddlewareMixin
from django.utils import timezone

from .models import Bitacora


# --- Filtros para “ruido” del admin/estáticos cuando usamos modo minimal ---
EXCLUDE_PREFIXES = ("/static", "/admin/jsi18n")
EXCLUDE_ENDSWITH = ("favicon.ico",)

# --- Prefijos de rutas de autenticación que se registran explícitamente en las vistas ---
AUTH_PREFIXES = (
    "/api/auth/",  # AuthViewSet (login/logout personalizados)
    "/api/token/",  # SimpleJWT por defecto (si lo usas en algún lugar)
    "/api/auth/token/",  # Refresh bajo /api/auth/token/refresh/
)


def _debe_ignorar_minimal(path: str, method: str) -> bool:
    """
    Política minimalista:
    - ignora navegación (GET/HEAD)
    - ignora recursos estáticos / favicon / jsi18n del admin
    """
    if method in ("GET", "HEAD"):
        return True
    p = (path or "").lower()
    if p.endswith(EXCLUDE_ENDSWITH) or any(
        p.startswith(pref) for pref in EXCLUDE_PREFIXES
    ):
        return True
    return False


def _es_ruta_auth(path: str) -> bool:
    """Evita registrar por middleware las rutas de autenticación (ya se registran en las vistas)."""
    p = (path or "").lower()
    return any(p.startswith(pref) for pref in AUTH_PREFIXES)


def _client_ip(request):
    # X-Forwarded-For si hubiera proxy (Nginx/Load Balancer)
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


class RequestBitacoraMiddleware(MiddlewareMixin):
    def __call__(self, request):
        # dejamos pasar el request hacia la vista y capturamos el response
        response = self.get_response(request)

        try:
            verbose = getattr(settings, "BITACORA_VERBOSE", False)

            # si estamos en modo minimal y esta request no es relevante → no guardamos
            if not verbose and _debe_ignorar_minimal(request.path, request.method):
                return response

            # no registrar aquí eventos de autenticación: se registran explícitamente en las vistas
            if _es_ruta_auth(request.path):
                return response

            accion = self._accion_inferida(request, response)

            usuario = None
            rol = None
            if getattr(request, "user", None) and request.user.is_authenticated:
                usuario = getattr(request.user, "username", None) or str(request.user)
                # tomamos el primer grupo como “rol” si existe
                first_group = request.user.groups.first()
                if first_group:
                    rol = first_group.name

            Bitacora.objects.create(
                fecha=timezone.now(),
                usuario=usuario,
                rol=rol,
                accion=accion,
                entidad=None,
                entidad_id=None,
                metodo=request.method,  # se guarda el método literal (GET/POST/PUT/DELETE)
                ruta=request.path,
                status=getattr(response, "status_code", None) or 0,
                ip=_client_ip(request),
                user_agent=request.META.get("HTTP_USER_AGENT"),
                extra=None,
            )
        except Exception:
            # Nunca romper la request por la bitácora
            pass

        return response

    # === Reglas de inferencia de acción (para rutas no-auth) ===
    def _accion_inferida(self, request, response):
        # Si quisieras mapear otras rutas especiales por path, hazlo aquí.
        # Por defecto, inferimos por método HTTP para CRUD.
        if request.method == "POST":
            return "CREATE"
        if request.method in ("PUT", "PATCH"):
            return "UPDATE"
        if request.method == "DELETE":
            return "DELETE"
        return "READ"
