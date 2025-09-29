# avisos/models.py
from django.conf import settings
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError

UNIDAD_MODEL = getattr(settings, "AVISOS_UNIDAD_MODEL", "api.UnidadHabitacional")


class Aviso(models.Model):
    class Estado(models.TextChoices):
        BORRADOR = "BORRADOR", "Borrador"
        PENDIENTE = "PENDIENTE", "Pendiente"
        PUBLICADO = "PUBLICADO", "Publicado"
        ARCHIVADO = "ARCHIVADO", "Archivado"
        RECHAZADO = "RECHAZADO", "Rechazado"

    class Visibilidad(models.TextChoices):
        TODOS = "TODOS", "Todos"
        SOLO_RESIDENTES = "SOLO_RESIDENTES", "Solo residentes"
        SOLO_ADMIN = "SOLO_ADMIN", "Solo administradores"
        POR_UNIDAD = "POR_UNIDAD", "Por unidad habitacional"

    titulo = models.CharField(max_length=160)
    contenido = models.TextField()
    estado = models.CharField(
        max_length=12, choices=Estado.choices, default=Estado.BORRADOR
    )
    requiere_aprobacion = models.BooleanField(default=False)

    visibilidad = models.CharField(
        max_length=20, choices=Visibilidad.choices, default=Visibilidad.TODOS
    )
    # 👇 Apunta al modelo configurable (api.UnidadHabitacional)
    unidades_destino = models.ManyToManyField(
        UNIDAD_MODEL, blank=True, related_name="avisos"
    )

    autor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="avisos_autor"
    )
    fecha_publicacion = models.DateTimeField(null=True, blank=True)
    vence_en = models.DateTimeField(null=True, blank=True)

    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["estado", "fecha_publicacion"])]
        ordering = ["-creado_en"]

    def __str__(self):
        return f"[{self.estado}] {self.titulo}"

    def clean(self):
        if (
            self.vence_en
            and self.fecha_publicacion
            and self.vence_en <= self.fecha_publicacion
        ):
            raise ValidationError(
                "La fecha de vencimiento debe ser posterior a la de publicación."
            )

    def puede_publicar(self):
        if self.requiere_aprobacion and self.estado not in [Aviso.Estado.PENDIENTE]:
            return False
        if not self.requiere_aprobacion and self.estado not in [Aviso.Estado.BORRADOR]:
            return False
        return True

    def publicar(self):
        if not self.puede_publicar():
            raise ValidationError("No es posible publicar desde el estado actual.")
        self.estado = Aviso.Estado.PUBLICADO  # 👈 fix de typo
        self.fecha_publicacion = timezone.now()

    def archivar(self):
        self.estado = Aviso.Estado.ARCHIVADO

    def aprobar(self):
        if not self.requiere_aprobacion:
            raise ValidationError("Este aviso no requiere aprobación.")
        if self.estado != Aviso.Estado.PENDIENTE:
            raise ValidationError("Solo avisos en PENDIENTE pueden aprobarse.")
        self.estado = Aviso.Estado.BORRADOR

    def rechazar(self):
        if not self.requiere_aprobacion:
            raise ValidationError("Este aviso no requiere aprobación.")
        if self.estado != Aviso.Estado.PENDIENTE:
            raise ValidationError("Solo avisos en PENDIENTE pueden rechazarse.")
        self.estado = Aviso.Estado.RECHAZADO


def adjunto_upload_to(instance, filename):
    from datetime import datetime

    now = datetime.now()
    return f"avisos/{now.year}/{now.month:02d}/{instance.aviso_id}/{filename}"


class Adjunto(models.Model):
    aviso = models.ForeignKey(Aviso, on_delete=models.CASCADE, related_name="adjuntos")
    archivo = models.FileField(upload_to=adjunto_upload_to)
    nombre_original = models.CharField(max_length=255, blank=True)
    tipo_mime = models.CharField(max_length=100, blank=True)
    tamano_bytes = models.BigIntegerField(default=0)
    subido_en = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.archivo and not self.nombre_original:
            self.nombre_original = getattr(self.archivo, "name", "")
        if self.archivo and hasattr(self.archivo, "size"):
            self.tamano_bytes = self.archivo.size
        super().save(*args, **kwargs)
