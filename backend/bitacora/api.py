from rest_framework import viewsets, permissions, filters
from .models import Bitacora
from .serializers import BitacoraSerializer


class BitacoraViewSet(viewsets.ReadOnlyModelViewSet):
    """
    /api/bitacora/  -> lista (con filtro/búsqueda)
    /api/bitacora/{id}/ -> detalle
    """

    queryset = Bitacora.objects.all()
    serializer_class = BitacoraSerializer
    permission_classes = [permissions.IsAuthenticated]

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "usuario",
        "rol",
        "accion",
        "metodo",
        "ruta",
        "entidad",
        "entidad_id",
        "ip",
    ]
    ordering_fields = ["fecha", "status", "metodo", "accion"]
    ordering = ["-fecha"]
