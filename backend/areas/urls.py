from rest_framework.routers import DefaultRouter
from .views import AreaViewSet, ReservaViewSet, ReglaAreaViewSet

router = DefaultRouter()
router.register(r"areas", AreaViewSet, basename="areas")
router.register(r"reglas-area", ReglaAreaViewSet, basename="reglas-area")
router.register(r"reservas", ReservaViewSet, basename="reservas")
urlpatterns = router.urls
