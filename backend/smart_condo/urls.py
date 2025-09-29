from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import (
    AuthViewSet,
    UserViewSet,
    UnidadHabitacionalViewSet,
    RolViewSet,
    PrivilegioViewSet,
    RolPrivilegioViewSet,
    CuotaViewSet,
    InvitadoViewSet,
    RostroUsuarioViewSet,
    RegistroAccesoViewSet,
)

# cu10
from django.conf import settings
from django.conf.urls.static import static

router = DefaultRouter()
router.register(r"auth", AuthViewSet, basename="auth")
router.register(r"users", UserViewSet)
router.register(r"unidades", UnidadHabitacionalViewSet)
router.register(r"roles", RolViewSet)
router.register(r"privilegios", PrivilegioViewSet)
router.register(r"rol-privilegios", RolPrivilegioViewSet, basename="rolprivilegio")
router.register(r"cuotas", CuotaViewSet)
router.register(r"invitados", InvitadoViewSet)
router.register(r'rostros', RostroUsuarioViewSet)
router.register(r'accesos', RegistroAccesoViewSet)


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    path("api/", include("bitacora.urls")),
    path("api/", include("areas.urls")),
    path("api/", include("avisos.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
