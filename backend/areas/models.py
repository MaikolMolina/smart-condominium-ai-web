from django.conf import settings
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError


class Area(models.Model):
    nombre = models.CharField(max_length=120, unique=True)
    descripcion = models.TextField(blank=True)
    aforo_max = models.PositiveIntegerField(default=1)
    requiere_aprobacion = models.BooleanField(default=False)
    hora_apertura = models.TimeField(null=True, blank=True)  # opcional
    hora_cierre = models.TimeField(null=True, blank=True)  # opcional
    max_duracion_min = models.PositiveIntegerField(default=180)  # duración máxima
    buffer_min = models.PositiveIntegerField(default=0)  # minutos entre reservas
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre


class ReglaArea(models.Model):
    """Reglas simples por día de semana (0=lunes ... 6=domingo) para horarios especiales."""

    area = models.ForeignKey(Area, on_delete=models.CASCADE, related_name="reglas")
    dia_semana = models.IntegerField(choices=[(i, i) for i in range(7)])
    hora_apertura = models.TimeField()
    hora_cierre = models.TimeField()

    class Meta:
        unique_together = ("area", "dia_semana")

    def __str__(self):
        return f"{self.area.nombre} - {self.dia_semana}"


class Reserva(models.Model):
    class Estado(models.TextChoices):
        PENDIENTE = "PENDIENTE", "Pendiente"
        APROBADA = "APROBADA", "Aprobada"
        CANCELADA = "CANCELADA", "Cancelada"
        RECHAZADA = "RECHAZADA", "Rechazada"

    area = models.ForeignKey(Area, on_delete=models.PROTECT, related_name="reservas")
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="reservas"
    )
    inicio = models.DateTimeField()
    fin = models.DateTimeField()
    asistentes = models.PositiveIntegerField(default=1)
    estado = models.CharField(
        max_length=12, choices=Estado.choices, default=Estado.PENDIENTE
    )
    motivo = models.CharField(max_length=255, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["area", "inicio"]),
        ]
        ordering = ["-inicio"]

    def clean(self):
        if self.inicio >= self.fin:
            raise ValidationError("La hora de inicio debe ser menor a la hora de fin.")
        if self.asistentes > self.area.aforo_max:
            raise ValidationError("Asistentes exceden el aforo del área.")

        # Validar duración máxima
        dur_min = int((self.fin - self.inicio).total_seconds() // 60)
        if dur_min > self.area.max_duracion_min:
            raise ValidationError(
                f"Duración supera el máximo permitido ({self.area.max_duracion_min} min)."
            )

        # Validar ventana de horario del área (regla del día si existe, si no usa global)
        local_dt = timezone.localtime(self.inicio)
        dia_sem = local_dt.weekday()
        regla = self.area.reglas.filter(dia_semana=dia_sem).first()
        h_open = regla.hora_apertura if regla else self.area.hora_apertura
        h_close = regla.hora_cierre if regla else self.area.hora_cierre
        if h_open and h_close:
            if not (h_open <= local_dt.time() <= h_close):
                raise ValidationError(
                    "La reserva inicia fuera del horario permitido del área."
                )
            if not (h_open <= timezone.localtime(self.fin).time() <= h_close):
                raise ValidationError(
                    "La reserva finaliza fuera del horario permitido del área."
                )

        # Validar solapamiento con otras reservas activas (pendiente/aprobada)
        estados_activos = [Reserva.Estado.PENDIENTE, Reserva.Estado.APROBADA]
        qs = Reserva.objects.filter(area=self.area, estado__in=estados_activos)
        if self.pk:
            qs = qs.exclude(pk=self.pk)
        overlap = qs.filter(inicio__lt=self.fin, fin__gt=self.inicio).exists()
        if overlap:
            raise ValidationError(
                "Ya existe una reserva activa que se solapa en este intervalo."
            )

        # Validar buffer
        if self.area.buffer_min:
            from datetime import timedelta

            before = qs.filter(
                fin__gt=self.inicio - timedelta(minutes=self.area.buffer_min),
                fin__lte=self.inicio,
            ).exists()
            after = qs.filter(
                inicio__lt=self.fin + timedelta(minutes=self.area.buffer_min),
                inicio__gte=self.fin,
            ).exists()
            if before or after:
                raise ValidationError(
                    f"Debe respetarse un buffer de {self.area.buffer_min} min entre reservas."
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)
