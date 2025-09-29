from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, UnidadHabitacional, Rol, Privilegio, RolPrivilegio, Cuota, Invitado, RostroUsuario, RegistroAcceso
from django.utils import timezone


class UnidadHabitacionalSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnidadHabitacional
        fields = '__all__'

class PrivilegioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Privilegio
        fields = '__all__'

class RolSerializer(serializers.ModelSerializer):
    privilegios = PrivilegioSerializer(many=True, read_only=True)
    
    class Meta:
        model = Rol
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    unidad_habitacional_info = UnidadHabitacionalSerializer(source='unidad_habitacional', read_only=True)
    rol_info = RolSerializer(source='rol', read_only=True)  # Nuevo campo para información del rol
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'ci', 
                 'telefono', 'rol', 'rol_info', 'unidad_habitacional', 'unidad_habitacional_info', 'password', 'is_superuser')
        extra_kwargs = {
            'password': {'write_only': True}
        }
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if user:
                if user.is_active:
                    data['user'] = user
                else:
                    raise serializers.ValidationError('Usuario desactivado')
            else:
                raise serializers.ValidationError('Credenciales inválidas')
        else:
            raise serializers.ValidationError('Debe proporcionar username y password')
        
        return data

class RolPrivilegioSerializer(serializers.ModelSerializer):
    class Meta:
        model = RolPrivilegio
        fields = '__all__'

class CuotaSerializer(serializers.ModelSerializer):
    unidad_habitacional_info = UnidadHabitacionalSerializer(source='unidad_habitacional', read_only=True)
    
    class Meta:
        model = Cuota
        fields = '__all__'

class InvitadoSerializer(serializers.ModelSerializer):
    residente_info = UserSerializer(source='residente', read_only=True)
    residente = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = Invitado
        fields = '__all__'
    
    def validate_fecha_evento(self, value):
        if value < timezone.now().date():
            raise serializers.ValidationError("La fecha del evento no puede ser en el pasado")
        return value
    
    def validate(self, data):
        if data['hora_inicio'] >= data['hora_fin']:
            raise serializers.ValidationError("La hora de inicio debe ser anterior a la hora de fin")
        return data
    
class RostroUsuarioSerializer(serializers.ModelSerializer):
    usuario_info = UserSerializer(source='usuario', read_only=True)
    
    class Meta:
        model = RostroUsuario
        fields = '__all__'

class RegistroAccesoSerializer(serializers.ModelSerializer):
    usuario_info = UserSerializer(source='usuario', read_only=True)
    
    class Meta:
        model = RegistroAcceso
        fields = '__all__'