from rest_framework import serializers
from .models import Area, Reserva, ReglaArea


class ReglaAreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReglaArea
        fields = "__all__"


class AreaSerializer(serializers.ModelSerializer):
    reglas = ReglaAreaSerializer(many=True, read_only=True)

    class Meta:
        model = Area
        fields = "__all__"


class ReservaSerializer(serializers.ModelSerializer):
    usuario = serializers.PrimaryKeyRelatedField(read_only=True)
    area_nombre = serializers.CharField(source="area.nombre", read_only=True)

    class Meta:
        model = Reserva
        fields = [
            "id",
            "area",
            "area_nombre",
            "usuario",
            "inicio",
            "fin",
            "asistentes",
            "estado",
            "motivo",
            "creado_en",
            "actualizado_en",
        ]
        read_only_fields = ["estado", "creado_en", "actualizado_en"]

    def create(self, validated_data):
        validated_data["usuario"] = self.context["request"].user
        reserva = super().create(validated_data)
        # Hook bitácora / notificación:
        self._audit("RESERVA_CREADA", reserva)
        self._notify("reserva_creada", reserva)
        return reserva

    def _audit(self, action, reserva):
        try:
            from core.audit import audit_log  # adapta a tu proyecto

            audit_log(
                user=self.context["request"].user,
                action=action,
                entity="Reserva",
                entity_id=reserva.id,
                data=self.to_representation(reserva),
            )
        except Exception:
            pass

    def _notify(self, event, reserva):
        try:
            from core.notifications import notify_event

            notify_event(event, payload=self.to_representation(reserva))
        except Exception:
            pass
