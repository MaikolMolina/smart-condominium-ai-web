# backend/bitacora/utils.py
from django.utils import timezone
from .models import Bitacora


def _client_ip(request):
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def registrar_bitacora(
    request,
    *,
    accion,
    entidad="AUTH",
    entidad_id=None,
    status=200,
    user=None,
    extra=None
):
    """
    Registra un evento en Bitácora.
    - accion: 'ACCESO', 'LOGOUT', 'ACCESO_FALLIDO', etc.
    - user: permite forzar el usuario (útil en login)
    """
    u = user if user is not None else getattr(request, "user", None)
    username = ""
    rol = ""

    if getattr(u, "is_authenticated", False):
        username = u.get_username()
        g = u.groups.first()
        rol = g.name if g else ""
    elif hasattr(u, "get_username"):
        username = u.get_username() or ""

    Bitacora.objects.create(
        fecha=timezone.now(),
        usuario=username,
        rol=rol,
        accion=accion,
        entidad=entidad,
        entidad_id=entidad_id,
        metodo=request.method,  # ⚠️ guarda POST/GET literal (no “CORREO”)
        ruta=request.path,
        status=status,
        ip=_client_ip(request),
        user_agent=request.META.get("HTTP_USER_AGENT", ""),
        extra=extra or {},
    )
