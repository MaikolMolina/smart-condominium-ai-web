from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models import Area, Reserva, ReglaArea
from .serializers import AreaSerializer, ReservaSerializer, ReglaAreaSerializer
from .permissions import IsAdminOrReadOnly


class AreaViewSet(viewsets.ModelViewSet):
    queryset = Area.objects.all()
    serializer_class = AreaSerializer
    permission_classes = [IsAuthenticated & IsAdminOrReadOnly]


class ReglaAreaViewSet(viewsets.ModelViewSet):
    queryset = ReglaArea.objects.all()
    serializer_class = ReglaAreaSerializer
    permission_classes = [IsAuthenticated & IsAdminOrReadOnly]


class ReservaViewSet(viewsets.ModelViewSet):
    queryset = Reserva.objects.select_related("area", "usuario").all()
    serializer_class = ReservaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        area_id = self.request.query_params.get("area")
        estado = self.request.query_params.get("estado")
        mias = self.request.query_params.get("mias")
        if area_id:
            qs = qs.filter(area_id=area_id)
        if estado:
            qs = qs.filter(estado=estado)
        if mias == "1":
            qs = qs.filter(usuario=self.request.user)
        return qs

    def perform_destroy(self, instance):
        # Cancelar si es del usuario o admin; físico solo admin:
        user = self.request.user
        if instance.usuario != user and not user.is_staff:
            return Response({"detail": "No puede borrar reservas ajenas."}, status=403)
        instance.estado = Reserva.Estado.CANCELADA
        instance.save()
        # Hooks
        try:
            from core.notifications import notify_event

            notify_event("reserva_cancelada", payload={"id": instance.id})
        except Exception:
            pass

    @action(detail=True, methods=["post"])
    def aprobar(self, request, pk=None):
        if not request.user.is_staff:
            return Response({"detail": "Solo administradores."}, status=403)
        reserva = self.get_object()
        reserva.estado = Reserva.Estado.APROBADA
        reserva.save()
        try:
            from core.notifications import notify_event

            notify_event("reserva_aprobada", payload={"id": reserva.id})
        except Exception:
            pass
        return Response(self.get_serializer(reserva).data)

    @action(detail=True, methods=["post"])
    def cancelar(self, request, pk=None):
        reserva = self.get_object()
        if reserva.usuario != request.user and not request.user.is_staff:
            return Response(
                {"detail": "No puede cancelar reservas ajenas."}, status=403
            )
        reserva.estado = Reserva.Estado.CANCELADA
        reserva.save()
        try:
            from core.notifications import notify_event

            notify_event("reserva_cancelada", payload={"id": reserva.id})
        except Exception:
            pass
        return Response(self.get_serializer(reserva).data)
