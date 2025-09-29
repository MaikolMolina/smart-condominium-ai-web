from django.contrib import admin
from .models import Bitacora


@admin.register(Bitacora)
class BitacoraAdmin(admin.ModelAdmin):
    list_display = (
        "fecha",
        "usuario",
        "rol",
        "accion",
        "entidad",
        "entidad_id",
        "metodo",
        "ruta",
        "status",
    )
    list_filter = (
        "accion",
        "rol",
        "metodo",
        "status",
        ("fecha", admin.DateFieldListFilter),
    )
    search_fields = ("usuario", "ruta", "entidad", "entidad_id", "ip", "user_agent")
    list_per_page = 50
    ordering = ("-fecha",)
