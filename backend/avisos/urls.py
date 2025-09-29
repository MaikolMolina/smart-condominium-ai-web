from rest_framework.routers import DefaultRouter
from .views import AvisoViewSet, AdjuntoViewSet

router = DefaultRouter()
router.register(r"avisos", AvisoViewSet, basename="avisos")
router.register(r"avisos-adjuntos", AdjuntoViewSet, basename="avisos-adjuntos")
urlpatterns = router.urls
