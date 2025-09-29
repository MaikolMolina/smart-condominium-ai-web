import uuid
from django.db import models
from django.utils import timezone


class Bitacora(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    ACCION_CHOICES = [
        ("LOGIN", "Login"),
        ("LOGOUT", "Logout"),
        ("CREATE", "Create"),
        ("READ", "Read"),
        ("UPDATE", "Update"),
        ("DELETE", "Delete"),
    ]

    fecha = models.DateTimeField(default=timezone.now, db_index=True)
    usuario = models.CharField(max_length=150, blank=True, null=True)
    rol = models.CharField(max_length=150, blank=True, null=True)

    accion = models.CharField(max_length=10, choices=ACCION_CHOICES, default="READ")
    entidad = models.CharField(max_length=150, blank=True, null=True)
    entidad_id = models.CharField(max_length=50, blank=True, null=True)

    metodo = models.CharField(max_length=10)
    ruta = models.CharField(max_length=512)
    status = models.PositiveIntegerField()

    ip = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    extra = models.JSONField(blank=True, null=True)

    class Meta:
        ordering = ["-fecha"]
        verbose_name = "Bitácora"
        verbose_name_plural = "Bitácoras"

    def __str__(self):
        u = self.usuario or "-"
        return f"[{self.fecha:%Y-%m-%d %H:%M}] {u} {self.accion} {self.ruta}"
