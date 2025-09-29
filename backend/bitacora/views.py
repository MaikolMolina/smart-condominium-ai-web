# backend/bitacora/views.py
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.pagination import PageNumberPagination

from .models import Bitacora
from .serializers import BitacoraSerializer


class BitacoraPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 200


class BitacoraViewSet(ReadOnlyModelViewSet):
    queryset = Bitacora.objects.all().order_by("-fecha")
    serializer_class = BitacoraSerializer
    # Solo usuarios autenticados que además sean admin (is_staff)
    permission_classes = [IsAuthenticated, IsAdminUser]
    pagination_class = BitacoraPagination

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ["ruta", "entidad", "user_agent", "usuario", "rol", "ip"]
    filterset_fields = ["accion", "metodo", "status", "usuario"]
    ordering_fields = [
        "fecha",
        "usuario",
        "rol",
        "accion",
        "entidad",
        "metodo",
        "ruta",
        "status",
        "ip",
    ]

    def get_queryset(self):
        qs = super().get_queryset()
        fecha_desde = self.request.query_params.get("fecha_desde")
        fecha_hasta = self.request.query_params.get("fecha_hasta")
        if fecha_desde:
            qs = qs.filter(fecha__date__gte=fecha_desde)
        if fecha_hasta:
            qs = qs.filter(fecha__date__lte=fecha_hasta)
        return qs
