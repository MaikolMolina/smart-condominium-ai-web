import json
import base64
from django.core.files.base import ContentFile
from django.utils import timezone
from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import login
from .models import (
    User,
    UnidadHabitacional,
    Rol,
    Privilegio,
    RolPrivilegio,
    Cuota,
    Invitado,
    RostroUsuario, 
    RegistroAcceso,
    ConfiguracionReconocimiento,
)
from .serializers import (
    UserSerializer,
    LoginSerializer,
    UnidadHabitacionalSerializer,
    RolSerializer,
    PrivilegioSerializer,
    RolPrivilegioSerializer,
    CuotaSerializer,
    InvitadoSerializer,
    RostroUsuarioSerializer, 
    RegistroAccesoSerializer,
    
)
from .permissions import TienePrivilegio
from .services.facial_recognition_service import facial_service
from bitacora.utils import registrar_bitacora


class AuthViewSet(viewsets.ViewSet):
    """
    /api/auth/login/  -> POST {username, password} -> {access, refresh, user}
    /api/auth/logout/ -> POST {refresh|refresh_token} -> 205
    """

    permission_classes = [AllowAny]

    @action(detail=False, methods=["post"])
    def login(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            refresh = RefreshToken.for_user(user)

            # Bitácora: LOGIN exitoso
            try:
                registrar_bitacora(
                    request,
                    accion="LOGIN",  # usa choices del modelo
                    entidad="AUTH",
                    status=status.HTTP_200_OK,
                    user=user,
                    extra={"endpoint": "login"},
                )
            except Exception:
                pass

            return Response(
                {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                    "user": UserSerializer(user).data,
                },
                status=status.HTTP_200_OK,
            )

        # (opcional) podrías registrar intento fallido si amplías tus choices
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def logout(self, request):
        """
        Acepta {"refresh"} o {"refresh_token"} y siempre intenta registrar en bitácora,
        incluso si el cliente ya no tiene access (por eso AllowAny).
        """
        refresh_token = request.data.get("refresh") or request.data.get("refresh_token")
        user_obj = None

        if not refresh_token:
            # (opcional) registra fallo si amplías tus choices
            return Response(
                {"detail": "refresh token required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            rt = RefreshToken(refresh_token)

            # Intenta resolver el usuario del payload del refresh
            user_id = rt.get("user_id", None)
            if user_id:
                try:
                    user_obj = User.objects.get(pk=user_id)
                except User.DoesNotExist:
                    user_obj = None

            # Blacklist si está activado
            try:
                rt.blacklist()
            except Exception:
                pass

            # Bitácora: LOGOUT correcto
            try:
                registrar_bitacora(
                    request,
                    accion="LOGOUT",
                    entidad="AUTH",
                    status=status.HTTP_205_RESET_CONTENT,
                    user=user_obj,
                    extra={"endpoint": "logout"},
                )
            except Exception:
                pass

            return Response(status=status.HTTP_205_RESET_CONTENT)

        except Exception as ex:
            # (opcional) registra fallo si amplías tus choices
            return Response(
                {"detail": "invalid refresh token"}, status=status.HTTP_400_BAD_REQUEST
            )


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, TienePrivilegio]

    def get_privilegio_requerido(self):
        if self.action == "list" or self.action == "retrieve":
            return "users.view"
        elif self.action == "create":
            return "users.create"
        elif self.action == "update" or self.action == "partial_update":
            return "users.edit"
        elif self.action == "destroy":
            return "users.delete"
        return None

    def get_permissions(self):
        # Asignar el privilegio requerido a la vista
        self.privilegio_requerido = self.get_privilegio_requerido()
        return super().get_permissions()


class UnidadHabitacionalViewSet(viewsets.ModelViewSet):
    queryset = UnidadHabitacional.objects.all()
    serializer_class = UnidadHabitacionalSerializer
    permission_classes = [IsAuthenticated, TienePrivilegio]

    def get_privilegio_requerido(self):
        if self.action == "list" or self.action == "retrieve":
            return "units.view"
        elif self.action == "create":
            return "units.create"
        elif self.action == "update" or self.action == "partial_update":
            return "units.edit"
        elif self.action == "destroy":
            return "units.delete"
        return None

    def get_permissions(self):
        self.privilegio_requerido = self.get_privilegio_requerido()
        return super().get_permissions()


class RolViewSet(viewsets.ModelViewSet):
    queryset = Rol.objects.all()
    serializer_class = RolSerializer
    permission_classes = [IsAuthenticated, TienePrivilegio]

    def get_privilegio_requerido(self):
        if self.action in ["list", "retrieve"]:
            return "roles.view"
        elif self.action == "create":
            return "roles.create"
        elif self.action in ["update", "partial_update"]:
            return "roles.edit"
        elif self.action == "destroy":
            return "roles.delete"
        return None

    def get_permissions(self):
        self.privilegio_requerido = self.get_privilegio_requerido()
        return super().get_permissions()


class PrivilegioViewSet(viewsets.ModelViewSet):
    queryset = Privilegio.objects.all()
    serializer_class = PrivilegioSerializer
    permission_classes = [IsAuthenticated, TienePrivilegio]

    def get_privilegio_requerido(self):
        if self.action == "list" or self.action == "retrieve":
            return "privileges.view"
        elif self.action == "create":
            return "privileges.create"
        elif self.action == "update" or self.action == "partial_update":
            return "privileges.edit"
        elif self.action == "destroy":
            return "privileges.delete"
        return None

    def get_permissions(self):
        self.privilegio_requerido = self.get_privilegio_requerido()
        return super().get_permissions()


class RolPrivilegioViewSet(viewsets.ModelViewSet):
    queryset = RolPrivilegio.objects.all()
    serializer_class = RolPrivilegioSerializer
    permission_classes = [IsAuthenticated]


class RolPrivilegioViewSet(viewsets.ModelViewSet):
    queryset = RolPrivilegio.objects.all()
    serializer_class = RolPrivilegioSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=["get"])
    def privilegios(self, request, pk=None):
        rol = self.get_object()
        privilegios = rol.privilegios.all()
        serializer = PrivilegioSerializer(privilegios, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def asignar_privilegio(self, request, pk=None):
        rol = self.get_object()
        privilegio_id = request.data.get("privilegio_id")

        if not privilegio_id:
            return Response(
                {"error": "privilegio_id es requerido"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            privilegio = Privilegio.objects.get(id=privilegio_id)
        except Privilegio.DoesNotExist:
            return Response(
                {"error": "Privilegio no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )

        # Verificar si ya existe la relación
        if RolPrivilegio.objects.filter(rol=rol, privilegio=privilegio).exists():
            return Response(
                {"error": "Este privilegio ya está asignado al rol"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        rol_privilegio = RolPrivilegio.objects.create(rol=rol, privilegio=privilegio)
        serializer = RolPrivilegioSerializer(rol_privilegio)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["delete"])
    def remover_privilegio(self, request, pk=None, privilegio_pk=None):
        rol = self.get_object()

        try:
            privilegio = Privilegio.objects.get(id=privilegio_pk)
        except Privilegio.DoesNotExist:
            return Response(
                {"error": "Privilegio no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )

        try:
            rol_privilegio = RolPrivilegio.objects.get(rol=rol, privilegio=privilegio)
            rol_privilegio.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except RolPrivilegio.DoesNotExist:
            return Response(
                {"error": "Este privilegio no está asignado al rol"},
                status=status.HTTP_404_NOT_FOUND,
            )


class CuotaViewSet(viewsets.ModelViewSet):
    queryset = Cuota.objects.all()
    serializer_class = CuotaSerializer
    permission_classes = [IsAuthenticated, TienePrivilegio]

    def get_privilegio_requerido(self):
        if self.action == "list" or self.action == "retrieve":
            return "fees.view"
        elif self.action == "create":
            return "fees.create"
        elif self.action == "update" or self.action == "partial_update":
            return "fees.edit"
        elif self.action == "destroy":
            return "fees.delete"
        return None

    def get_permissions(self):
        self.privilegio_requerido = self.get_privilegio_requerido()
        return super().get_permissions()


class InvitadoViewSet(viewsets.ModelViewSet):
    queryset = Invitado.objects.all()
    serializer_class = InvitadoSerializer
    permission_classes = [IsAuthenticated, TienePrivilegio]

    def get_privilegio_requerido(self):
        if self.action == "list" or self.action == "retrieve":
            return "guests.view"
        elif self.action == "create":
            return "guests.create"
        elif self.action == "update" or self.action == "partial_update":
            return "guests.edit"
        elif self.action == "destroy":
            return "guests.delete"
        return None

    def get_permissions(self):
        self.privilegio_requerido = self.get_privilegio_requerido()
        return super().get_permissions()

    def get_queryset(self):
        queryset = Invitado.objects.all()

        # Si el usuario no es administrador, solo puede ver sus propios invitados
        if not self.request.user.is_superuser:
            queryset = queryset.filter(residente=self.request.user)

        # Filtros opcionales
        estado = self.request.query_params.get("estado", None)
        if estado is not None:
            queryset = queryset.filter(estado=estado)

        fecha_desde = self.request.query_params.get("fecha_desde", None)
        if fecha_desde is not None:
            queryset = queryset.filter(fecha_evento__gte=fecha_desde)

        fecha_hasta = self.request.query_params.get("fecha_hasta", None)
        if fecha_hasta is not None:
            queryset = queryset.filter(fecha_evento__lte=fecha_hasta)

        return queryset

    def perform_create(self, serializer):
        # Asignar automáticamente el residente actual al crear un invitado
        serializer.save(residente=self.request.user)

    @action(detail=True, methods=["post"])
    def aprobar(self, request, pk=None):
        if not request.user.is_superuser:
            return Response(
                {"error": "Solo los administradores pueden aprobar invitados"},
                status=status.HTTP_403_FORBIDDEN,
            )

        invitado = self.get_object()
        invitado.estado = "aprobado"
        invitado.save()

        serializer = self.get_serializer(invitado)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def rechazar(self, request, pk=None):
        if not request.user.is_superuser:
            return Response(
                {"error": "Solo los administradores pueden rechazar invitados"},
                status=status.HTTP_403_FORBIDDEN,
            )

        invitado = self.get_object()
        observaciones = request.data.get("observaciones", "")

        invitado.estado = "rechazado"
        invitado.observaciones = observaciones
        invitado.save()

        serializer = self.get_serializer(invitado)
        return Response(serializer.data)

class RostroUsuarioViewSet(viewsets.ModelViewSet):
    queryset = RostroUsuario.objects.all()
    serializer_class = RostroUsuarioSerializer
    permission_classes = [IsAuthenticated, TienePrivilegio]
    
    def get_privilegio_requerido(self):
        if self.action == 'list' or self.action == 'retrieve':
            return 'facial.view'
        elif self.action == 'create':
            return 'facial.create'
        elif self.action == 'update' or self.action == 'partial_update':
            return 'facial.edit'
        elif self.action == 'destroy':
            return 'facial.delete'
        return None
        
    def get_permissions(self):
        self.privilegio_requerido = self.get_privilegio_requerido()
        return super().get_permissions()
    
    @action(detail=False, methods=['post'])
    def procesar_acceso_automatico(self, request):
        """Endpoint para procesamiento automático de acceso por reconocimiento facial"""
        try:
            embedding_entrante = request.data.get('embedding')
            imagen_captura = request.data.get('imagen')
            
            if not embedding_entrante:
                return Response({'error': 'Embedding es requerido'}, status=400)
            
            # Realizar reconocimiento facial
            resultado = facial_service.reconocer_rostro(embedding_entrante)
            
            if resultado['reconocido']:
                # Determinar tipo de acceso (entrada/salida)
                tipo_acceso = facial_service.determinar_tipo_acceso(resultado['usuario']['id'])
                
                # Registrar el acceso
                registro_data = {
                    'usuario_id': resultado['usuario']['id'],
                    'tipo_acceso': tipo_acceso,
                    'confianza': resultado['confianza'],
                    'imagen': imagen_captura,
                    'estado': 'exitoso'
                }
                
                # Crear registro de acceso
                registro_response = self.crear_registro_acceso(registro_data)
                
                # Actualizar estadísticas del rostro
                if resultado['rostro_id']:
                    try:
                        rostro = RostroUsuario.objects.get(id=resultado['rostro_id'])
                        rostro.actualizar_estadisticas(resultado['confianza'])
                    except RostroUsuario.DoesNotExist:
                        pass
                
                return Response({
                    'acceso_permitido': True,
                    'usuario': resultado['usuario'],
                    'tipo_acceso': tipo_acceso,
                    'confianza': resultado['confianza'],
                    'mensaje': f"Acceso de {tipo_acceso} permitido para {resultado['usuario']['nombre']}",
                    'registro_id': registro_response.data.get('registro_id')
                })
            else:
                # Registrar acceso fallido (persona no reconocida)
                registro_data = {
                    'usuario_id': None,
                    'tipo_acceso': 'intento_fallido',
                    'confianza': resultado['confianza'],
                    'imagen': imagen_captura,
                    'estado': 'fallido'
                }
                
                self.crear_registro_acceso(registro_data)
                
                return Response({
                    'acceso_permitido': False,
                    'mensaje': 'Persona no reconocida. Acceso denegado.',
                    'confianza': resultado['confianza']
                })
                
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    def crear_registro_acceso(self, datos):
        """Helper para crear registro de acceso"""
        try:
            usuario_id = datos.get('usuario_id')
            tipo_acceso = datos.get('tipo_acceso')
            confianza = datos.get('confianza')
            imagen_base64 = datos.get('imagen')
            estado = datos.get('estado', 'exitoso')
            
            registro = RegistroAcceso(
                usuario_id=usuario_id,
                tipo_acceso=tipo_acceso,
                confianza=confianza,
                estado=estado,
                timestamp=timezone.now()
            )
            
            # Guardar imagen de la captura si se proporciona
            if imagen_base64:
                try:
                    format, imgstr = imagen_base64.split(';base64,')
                    ext = format.split('/')[-1]
                    imagen_data = ContentFile(base64.b64decode(imgstr), 
                                            name=f'acceso_{int(timezone.now().timestamp())}.{ext}')
                    registro.imagen_captura.save(imagen_data.name, imagen_data, save=False)
                except Exception as e:
                    print(f"Error guardando imagen: {e}")
            
            registro.save()
            
            return Response({
                'success': True,
                'registro_id': registro.id,
                'mensaje': 'Registro de acceso creado exitosamente'
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Obtener estadísticas del sistema de reconocimiento"""
        try:
            total_rostros = RostroUsuario.objects.filter(esta_activo=True).count()
            total_accesos = RegistroAcceso.objects.count()
            accesos_hoy = RegistroAcceso.objects.filter(
                timestamp__date=timezone.now().date()
            ).count()
            
            # Últimos 10 accesos
            ultimos_accesos = RegistroAcceso.objects.select_related('usuario').order_by('-timestamp')[:10]
            ultimos_accesos_data = RegistroAccesoSerializer(ultimos_accesos, many=True).data
            
            return Response({
                'total_rostros_registrados': total_rostros,
                'total_accesos_registrados': total_accesos,
                'accesos_hoy': accesos_hoy,
                'ultimos_accesos': ultimos_accesos_data
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=False, methods=['post'])
    def registrar_rostro(self, request):
        """Registrar el rostro de un usuario con su embedding facial"""
        usuario_id = request.data.get('usuario_id')
        embedding = request.data.get('embedding')  # JSON string del vector facial
        imagen_base64 = request.data.get('imagen')  # Imagen en base64 para referencia
        
        try:
            usuario = User.objects.get(id=usuario_id)
            
            # Crear o actualizar el registro de rostro
            rostro, created = RostroUsuario.objects.get_or_create(
                usuario=usuario,
                defaults={'embedding': embedding}
            )
            
            if not created:
                rostro.embedding = embedding
                rostro.esta_activo = True
            
            # Guardar imagen de referencia si se proporciona
            if imagen_base64:
                format, imgstr = imagen_base64.split(';base64,')
                ext = format.split('/')[-1]
                imagen_data = ContentFile(base64.b64decode(imgstr), name=f'rostro_{usuario_id}.{ext}')
                rostro.imagen_referencia.save(imagen_data.name, imagen_data, save=False)
            
            rostro.save()
            
            return Response({
                'success': True,
                'message': 'Rostro registrado exitosamente',
                'rostro_id': rostro.id
            })
            
        except User.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=False, methods=['post'])
    def reconocer_rostro(self, request):
        """Reconocer un rostro a partir de un embedding"""
        embedding_entrante = request.data.get('embedding')
        umbral_confianza = float(request.data.get('umbral', 0.6))
        
        try:
            rostros_activos = RostroUsuario.objects.filter(esta_activo=True)
            usuario_reconocido = None
            mejor_confianza = 0
            
            for rostro in rostros_activos:
                # Simular cálculo de similitud (en producción usarías una biblioteca de IA)
                confianza = self.calcular_similitud(embedding_entrante, rostro.embedding)
                
                if confianza > mejor_confianza and confianza >= umbral_confianza:
                    mejor_confianza = confianza
                    usuario_reconocido = rostro.usuario
            
            return Response({
                'reconocido': usuario_reconocido is not None,
                'usuario': UserSerializer(usuario_reconocido).data if usuario_reconocido else None,
                'confianza': mejor_confianza
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    def calcular_similitud(self, embedding1, embedding2):
        """Función simplificada para calcular similitud entre embeddings"""
        # En producción, aquí integrarías con FaceAPI.js o similar
        # Esta es una simulación básica
        import random
        return round(random.uniform(0.7, 0.95), 2)  # Simular reconocimiento exitoso

class RegistroAccesoViewSet(viewsets.ModelViewSet):
    queryset = RegistroAcceso.objects.all()
    serializer_class = RegistroAccesoSerializer
    permission_classes = [IsAuthenticated, TienePrivilegio]
    
    def get_privilegio_requerido(self):
        if self.action == 'list' or self.action == 'retrieve':
            return 'access.view'
        elif self.action == 'create':
            return 'access.create'
        return None
        
    def get_permissions(self):
        self.privilegio_requerido = self.get_privilegio_requerido()
        return super().get_permissions()

    def get_queryset(self):
        queryset = RegistroAcceso.objects.all()
        
        # Filtrar por fecha si se proporciona
        fecha_inicio = self.request.query_params.get('fecha_inicio')
        fecha_fin = self.request.query_params.get('fecha_fin')
        
        if fecha_inicio:
            queryset = queryset.filter(timestamp__date__gte=fecha_inicio)
        if fecha_fin:
            queryset = queryset.filter(timestamp__date__lte=fecha_fin)
            
        return queryset

    @action(detail=False, methods=['post'])
    def registrar_acceso(self, request):
        """Registrar un evento de acceso (entrada/salida)"""
        usuario_id = request.data.get('usuario_id')
        tipo_acceso = request.data.get('tipo_acceso', 'entrada')
        confianza = request.data.get('confianza')
        imagen_base64 = request.data.get('imagen')
        
        try:
            usuario = User.objects.get(id=usuario_id) if usuario_id else None
            
            registro = RegistroAcceso(
                usuario=usuario,
                tipo_acceso=tipo_acceso,
                confianza=confianza,
                estado='exitoso' if usuario else 'fallido'
            )
            
            # Guardar imagen de la captura si se proporciona
            if imagen_base64:
                format, imgstr = imagen_base64.split(';base64,')
                ext = format.split('/')[-1]
                imagen_data = ContentFile(base64.b64decode(imgstr), name=f'acceso_{registro.timestamp}.{ext}')
                registro.imagen_captura.save(imagen_data.name, imagen_data, save=False)
            
            registro.save()
            
            return Response({
                'success': True,
                'registro_id': registro.id,
                'mensaje': f'Acceso de {tipo_acceso} registrado exitosamente'
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)
        
class ConfiguracionReconocimientoViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def obtener_configuracion(self, request):
        """Obtener toda la configuración del sistema"""
        configuraciones = ConfiguracionReconocimiento.objects.all()
        config_data = {config.nombre: config.valor for config in configuraciones}
        return Response(config_data)
    
    @action(detail=False, methods=['post'])
    def actualizar_configuracion(self, request):
        """Actualizar configuración del sistema"""
        if not request.user.is_superuser:
            return Response({'error': 'Solo administradores pueden modificar la configuración'}, 
                          status=403)
        
        configuraciones = request.data
        for nombre, valor in configuraciones.items():
            ConfiguracionReconocimiento.establecer_valor(nombre, str(valor))
        
        # Limpiar cache de configuraciones
        from django.core.cache import cache
        cache.delete('configuracion_reconocimiento')
        
        return Response({'success': True, 'message': 'Configuración actualizada correctamente'})