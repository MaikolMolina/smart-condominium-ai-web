from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

# from bitacora.api import BitacoraViewSet
from .views import BitacoraViewSet

router = DefaultRouter()
router.register(r"bitacora", BitacoraViewSet, basename="bitacora")


urlpatterns = router.urls

# urlpatterns = [
#  path("admin/", admin.site.urls),
#   path("api/", include(router.urls)),
# ]
