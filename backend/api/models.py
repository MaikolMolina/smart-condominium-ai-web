from django.db import models
from django.contrib.auth.models import AbstractUser

class UnidadHabitacional(models.Model):
    numero = models.CharField(max_length=10)
    piso = models.CharField(max_length=10, blank=True, null=True)
    torre = models.CharField(max_length=10, blank=True, null=True)
    metraje = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.torre or ''} - {self.piso or ''} - {self.numero}"
    
class Rol(models.Model):
    nombre = models.CharField(max_length=50)
    descripcion = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nombre

class User(AbstractUser):
    TIPO_USUARIO = [
        ('admin', 'Administrador'),
        ('residente', 'Residente'),
        ('inquilino', 'Inquilino'),
        ('mantenimiento', 'Personal de Mantenimiento'),
        ('seguridad', 'Personal de Seguridad'),
    ]
    
    ci = models.CharField(max_length=20, unique=True)
    telefono = models.CharField(max_length=20)
    rol = models.ForeignKey(Rol, on_delete=models.SET_NULL, null=True, blank=True, related_name='usuarios')
    unidad_habitacional = models.ForeignKey(UnidadHabitacional, on_delete=models.SET_NULL, null=True, blank=True)
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.ci}"


class Privilegio(models.Model):
    nombre = models.CharField(max_length=50)
    descripcion = models.TextField(blank=True, null=True)
    codigo = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nombre

class RolPrivilegio(models.Model):
    rol = models.ForeignKey(Rol, on_delete=models.CASCADE)
    privilegio = models.ForeignKey(Privilegio, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('rol', 'privilegio')

    def __str__(self):
        return f"{self.rol.nombre} - {self.privilegio.nombre}"
    
class Cuota(models.Model):
    TIPO_CHOICES = [
        ('ordinaria', 'Ordinaria'),
        ('extraordinaria', 'Extraordinaria'),
        ('multa', 'Multa'),
    ]
    
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('pagada', 'Pagada'),
        ('vencida', 'Vencida'),
    ]

    unidad_habitacional = models.ForeignKey(UnidadHabitacional, on_delete=models.CASCADE, related_name='cuotas')
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='ordinaria')
    descripcion = models.TextField(blank=True, null=True)
    fecha_emision = models.DateField(auto_now_add=True)
    fecha_vencimiento = models.DateField()
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cuota {self.tipo} - {self.unidad_habitacional} - {self.monto}"

    class Meta:
        ordering = ['-fecha_emision']

class Invitado(models.Model):
    TIPO_EVENTO_CHOICES = [
        ('cumpleanos', 'Cumpleaños'),
        ('reunion', 'Reunión'),
        ('fiesta', 'Fiesta'),
        ('otro', 'Otro'),
    ]
    
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('aprobado', 'Aprobado'),
        ('rechazado', 'Rechazado'),
    ]

    residente = models.ForeignKey(User, on_delete=models.CASCADE, related_name='invitados')
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    ci = models.CharField(max_length=20, verbose_name='Cédula de Identidad')
    email = models.EmailField(blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    tipo_evento = models.CharField(max_length=20, choices=TIPO_EVENTO_CHOICES, default='reunion')
    descripcion_evento = models.TextField(blank=True, null=True)
    fecha_evento = models.DateField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    numero_invitados = models.PositiveIntegerField(default=1)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    observaciones = models.TextField(blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nombre} {self.apellido} - {self.fecha_evento}"

    class Meta:
        ordering = ['-creado_en']
        verbose_name = 'Invitado'
        verbose_name_plural = 'Invitados'

class RostroUsuario(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
    ]

    usuario = models.OneToOneField(User, on_delete=models.CASCADE, related_name='rostro')
    embedding = models.TextField(help_text="Vector de características faciales en formato JSON")
    imagen_referencia = models.ImageField(upload_to='rostros/', null=True, blank=True)
    esta_activo = models.BooleanField(default=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    # Nuevos campos para mejorar el control
    ultimo_acceso = models.DateTimeField(null=True, blank=True)
    total_accesos = models.PositiveIntegerField(default=0)
    confianza_promedio = models.FloatField(default=0.0)

    def __str__(self):
        return f"Rostro de {self.usuario.get_full_name()}"

    def actualizar_estadisticas(self, confianza):
        """Actualizar estadísticas después de un acceso exitoso"""
        self.total_accesos += 1
        # Calcular confianza promedio ponderada
        if self.confianza_promedio == 0:
            self.confianza_promedio = confianza
        else:
            self.confianza_promedio = (self.confianza_promedio * (self.total_accesos - 1) + confianza) / self.total_accesos
        self.ultimo_acceso = timezone.now()
        self.save()

    class Meta:
        verbose_name = 'Rostro de Usuario'
        verbose_name_plural = 'Rostros de Usuario'

class RegistroAcceso(models.Model):
    TIPO_ACCESO = [
        ('entrada', 'Entrada'),
        ('salida', 'Salida'),
    ]
    
    ESTADO_RECONOCIMIENTO = [
        ('exitoso', 'Exitoso'),
        ('fallido', 'Fallido'),
        ('dudoso', 'Dudoso'),
    ]

    usuario = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    tipo_acceso = models.CharField(max_length=10, choices=TIPO_ACCESO)
    estado = models.CharField(max_length=10, choices=ESTADO_RECONOCIMIENTO, default='exitoso')
    confianza = models.FloatField(help_text="Nivel de confianza del reconocimiento (0-1)", null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    imagen_captura = models.ImageField(upload_to='accesos/', null=True, blank=True)
    observaciones = models.TextField(blank=True, null=True)

    def __str__(self):
        usuario_nombre = self.usuario.get_full_name() if self.usuario else "Desconocido"
        return f"{usuario_nombre} - {self.tipo_acceso} - {self.timestamp}"

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Registro de Acceso'
        verbose_name_plural = 'Registros de Acceso'

class ConfiguracionReconocimiento(models.Model):
    """Configuración del sistema de reconocimiento facial"""
    nombre = models.CharField(max_length=100, unique=True)
    valor = models.TextField()
    descripcion = models.TextField(blank=True, null=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nombre}: {self.valor}"

    @classmethod
    def obtener_valor(cls, nombre, default=None):
        try:
            return cls.objects.get(nombre=nombre).valor
        except cls.DoesNotExist:
            return default

    @classmethod
    def establecer_valor(cls, nombre, valor, descripcion=""):
        config, created = cls.objects.get_or_create(
            nombre=nombre,
            defaults={'valor': valor, 'descripcion': descripcion}
        )
        if not created:
            config.valor = valor
            config.descripcion = descripcion
            config.save()
        return config

    class Meta:
        verbose_name = 'Configuración de Reconocimiento'
        verbose_name_plural = 'Configuraciones de Reconocimiento'