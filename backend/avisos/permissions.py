from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminOrReadAudience(BasePermission):
    """
    - Admin (is_staff): full CRUD y acciones.
    - No admin: sólo lectura, limitada por audiencia (se filtra en get_queryset del ViewSet).
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_staff
