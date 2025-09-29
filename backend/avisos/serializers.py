# avisos/serializers.py
from django.apps import apps
from django.conf import settings
from rest_framework import serializers
from .models import Aviso, Adjunto

# Lee "api.UnidadHabitacional" de settings
UNIDAD_APP, UNIDAD_NAME = getattr(
    settings, "AVISOS_UNIDAD_MODEL", "api.UnidadHabitacional"
).split(".")


class AdjuntoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Adjunto
        fields = [
            "id",
            "aviso",
            "archivo",
            "nombre_original",
            "tipo_mime",
            "tamano_bytes",
            "subido_en",
        ]
        read_only_fields = ["nombre_original", "tipo_mime", "tamano_bytes", "subido_en"]


class AvisoSerializer(serializers.ModelSerializer):
    autor = serializers.PrimaryKeyRelatedField(read_only=True)
    adjuntos = AdjuntoSerializer(many=True, read_only=True)

    # DRF exige queryset en declaración → usamos none() y lo elevamos en __init__
    unidades_destino = serializers.PrimaryKeyRelatedField(
        many=True,
        required=False,
        queryset=apps.get_model(UNIDAD_APP, UNIDAD_NAME).objects.none(),
    )

    class Meta:
        model = Aviso
        fields = [
            "id",
            "titulo",
            "contenido",
            "estado",
            "requiere_aprobacion",
            "visibilidad",
            "unidades_destino",
            "autor",
            "fecha_publicacion",
            "vence_en",
            "creado_en",
            "actualizado_en",
            "adjuntos",
        ]
        read_only_fields = [
            "estado",
            "autor",
            "fecha_publicacion",
            "creado_en",
            "actualizado_en",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        Unidad = apps.get_model(UNIDAD_APP, UNIDAD_NAME)
        self.fields["unidades_destino"].queryset = Unidad.objects.all()

    def create(self, validated_data):
        unidades = validated_data.pop("unidades_destino", [])
        user = self.context["request"].user
        aviso = Aviso.objects.create(autor=user, **validated_data)
        if aviso.visibilidad == "POR_UNIDAD" and unidades:
            aviso.unidades_destino.set(unidades)
        return aviso

    def update(self, instance, validated_data):
        unidades = validated_data.pop("unidades_destino", None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()
        if unidades is not None:
            instance.unidades_destino.set(unidades)
        return instance
