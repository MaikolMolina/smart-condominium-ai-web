# backend/avisos/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone

from .models import Aviso, Adjunto
from .serializers import AvisoSerializer, AdjuntoSerializer

# Permiso “simple”: admin escribe, el resto solo lectura
from api.permissions import IsAdminOrReadOnly


class AvisoViewSet(viewsets.ModelViewSet):
    queryset = Aviso.objects.all().prefetch_related("adjuntos", "unidades_destino")
    serializer_class = AvisoSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()

        # Filtros querystring
        estado = self.request.query_params.get("estado")
        q = self.request.query_params.get("q")
        vigentes = self.request.query_params.get(
            "vigentes"
        )  # "1" => publicados no vencidos
        unidad_id = self.request.query_params.get("unidad")

        if estado:
            qs = qs.filter(estado=estado)
        if q:
            qs = qs.filter(Q(titulo__icontains=q) | Q(contenido__icontains=q))
        if vigentes == "1":
            now = timezone.now()
            qs = qs.filter(estado=Aviso.Estado.PUBLICADO).filter(
                Q(vence_en__isnull=True) | Q(vence_en__gt=now)
            )

        # Visibilidad (admin ve todo; no-admin se filtra)
        if not getattr(user, "is_staff", False):
            uid = getattr(user, "unidad_habitacional_id", None)
            audience_filter = (
                Q(visibilidad=Aviso.Visibilidad.TODOS)
                | Q(visibilidad=Aviso.Visibilidad.SOLO_RESIDENTES)
                | (
                    Q(visibilidad=Aviso.Visibilidad.POR_UNIDAD)
                    & Q(unidades_destino__id=uid)
                )
            )
            qs = (
                qs.filter(audience_filter)
                .exclude(visibilidad=Aviso.Visibilidad.SOLO_ADMIN)
                .distinct()
            )

        if unidad_id:
            qs = qs.filter(unidades_destino__id=unidad_id).distinct()

        return qs

    @action(detail=True, methods=["post"])
    def enviar_aprobacion(self, request, pk=None):
        aviso = self.get_object()
        if not request.user.is_staff:
            return Response({"detail": "Solo administradores."}, status=403)
        aviso.estado = Aviso.Estado.PENDIENTE
        aviso.save()
        self._notify("aviso_enviado_aprobacion", aviso)
        return Response(self.get_serializer(aviso).data)

    @action(detail=True, methods=["post"])
    def aprobar(self, request, pk=None):
        if not request.user.is_staff:
            return Response({"detail": "Solo administradores."}, status=403)
        aviso = self.get_object()
        try:
            aviso.aprobar()
            aviso.save()
            return Response(self.get_serializer(aviso).data)
        except Exception as e:
            return Response({"detail": str(e)}, status=400)

    @action(detail=True, methods=["post"])
    def rechazar(self, request, pk=None):
        if not request.user.is_staff:
            return Response({"detail": "Solo administradores."}, status=403)
        aviso = self.get_object()
        try:
            aviso.rechazar()
            aviso.save()
            return Response(self.get_serializer(aviso).data)
        except Exception as e:
            return Response({"detail": str(e)}, status=400)

    @action(detail=True, methods=["post"])
    def publicar(self, request, pk=None):
        if not request.user.is_staff:
            return Response({"detail": "Solo administradores."}, status=403)
        aviso = self.get_object()
        try:
            aviso.publicar()
            aviso.save()
        except Exception as e:
            return Response({"detail": str(e)}, status=400)
        # Hooks
        self._audit("AVISO_PUBLICADO", aviso)
        self._notify("aviso_publicado", aviso)
        return Response(self.get_serializer(aviso).data)

    @action(detail=True, methods=["post"])
    def archivar(self, request, pk=None):
        if not request.user.is_staff:
            return Response({"detail": "Solo administradores."}, status=403)
        aviso = self.get_object()
        aviso.archivar()
        aviso.save()
        self._audit("AVISO_ARCHIVADO", aviso)
        return Response(self.get_serializer(aviso).data)

    def _audit(self, action, aviso):
        try:
            from core.audit import audit_log

            audit_log(
                user=self.request.user,
                action=action,
                entity="Aviso",
                entity_id=aviso.id,
                data=self.get_serializer(aviso).data,
            )
        except Exception:
            pass

    def _notify(self, event, aviso):
        try:
            from core.notifications import notify_event

            notify_event(event, payload=self.get_serializer(aviso).data)
        except Exception:
            pass


class AdjuntoViewSet(viewsets.ModelViewSet):
    queryset = Adjunto.objects.select_related("aviso").all()
    serializer_class = AdjuntoSerializer
    permission_classes = [IsAdminOrReadOnly]

    def create(self, request, *args, **kwargs):
        # subir archivo con multipart/form-data: { aviso: <id>, archivo: <file> }
        return super().create(request, *args, **kwargs)
