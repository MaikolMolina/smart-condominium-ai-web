from django.core.management.base import BaseCommand
from api.models import Privilegio

class Command(BaseCommand):
    help = 'Crea los privilegios iniciales del sistema'

    def handle(self, *args, **options):
        privilegios = [
            # Privilegios de Usuarios
            {'nombre': 'Ver Usuarios', 'codigo': 'users.view', 'descripcion': 'Permite ver la lista de usuarios'},
            {'nombre': 'Crear Usuarios', 'codigo': 'users.create', 'descripcion': 'Permite crear nuevos usuarios'},
            {'nombre': 'Editar Usuarios', 'codigo': 'users.edit', 'descripcion': 'Permite editar usuarios existentes'},
            {'nombre': 'Eliminar Usuarios', 'codigo': 'users.delete', 'descripcion': 'Permite eliminar usuarios'},
            
            # Privilegios de Roles
            {'nombre': 'Ver Roles', 'codigo': 'roles.view', 'descripcion': 'Permite ver la lista de roles'},
            {'nombre': 'Crear Roles', 'codigo': 'roles.create', 'descripcion': 'Permite crear nuevos roles'},
            {'nombre': 'Editar Roles', 'codigo': 'roles.edit', 'descripcion': 'Permite editar roles existentes'},
            {'nombre': 'Eliminar Roles', 'codigo': 'roles.delete', 'descripcion': 'Permite eliminar roles'},
            
            # Privilegios de Privilegios
            {'nombre': 'Ver Privilegios', 'codigo': 'privileges.view', 'descripcion': 'Permite ver la lista de privilegios'},
            {'nombre': 'Crear Privilegios', 'codigo': 'privileges.create', 'descripcion': 'Permite crear nuevos privilegios'},
            {'nombre': 'Editar Privilegios', 'codigo': 'privileges.edit', 'descripcion': 'Permite editar privilegios existentes'},
            {'nombre': 'Eliminar Privilegios', 'codigo': 'privileges.delete', 'descripcion': 'Permite eliminar privilegios'},
            
            # Privilegios de Unidades
            {'nombre': 'Ver Unidades', 'codigo': 'units.view', 'descripcion': 'Permite ver la lista de unidades'},
            {'nombre': 'Crear Unidades', 'codigo': 'units.create', 'descripcion': 'Permite crear nuevas unidades'},
            {'nombre': 'Editar Unidades', 'codigo': 'units.edit', 'descripcion': 'Permite editar unidades existentes'},
            {'nombre': 'Eliminar Unidades', 'codigo': 'units.delete', 'descripcion': 'Permite eliminar unidades'},
            
            # Privilegios de Cuotas
            {'nombre': 'Ver Cuotas', 'codigo': 'fees.view', 'descripcion': 'Permite ver la lista de cuotas'},
            {'nombre': 'Crear Cuotas', 'codigo': 'fees.create', 'descripcion': 'Permite crear nuevas cuotas'},
            {'nombre': 'Editar Cuotas', 'codigo': 'fees.edit', 'descripcion': 'Permite editar cuotas existentes'},
            {'nombre': 'Eliminar Cuotas', 'codigo': 'fees.delete', 'descripcion': 'Permite eliminar cuotas'},

            {'nombre': 'Ver Invitados', 'codigo': 'guests.view', 'descripcion': 'Permite ver la lista de invitados'},
            {'nombre': 'Crear Invitados', 'codigo': 'guests.create', 'descripcion': 'Permite crear nuevos invitados'},
            {'nombre': 'Editar Invitados', 'codigo': 'guests.edit', 'descripcion': 'Permite editar invitados existentes'},
            {'nombre': 'Eliminar Invitados', 'codigo': 'guests.delete', 'descripcion': 'Permite eliminar invitados'},
            {'nombre': 'Aprobar Invitados', 'codigo': 'guests.approve', 'descripcion': 'Permite aprobar/rechazar invitados'},

            {'nombre': 'Ver Reconocimiento Facial', 'codigo': 'facial.view', 'descripcion': 'Permite ver módulo de reconocimiento facial'},
            {'nombre': 'Registrar Rostros', 'codigo': 'facial.create', 'descripcion': 'Permite registrar rostros de usuarios'},
            {'nombre': 'Gestionar Rostros', 'codigo': 'facial.edit', 'descripcion': 'Permite gestionar rostros registrados'},
            {'nombre': 'Eliminar Rostros', 'codigo': 'facial.delete', 'descripcion': 'Permite eliminar rostros'},
            {'nombre': 'Ver Registros de Acceso', 'codigo': 'access.view', 'descripcion': 'Permite ver registros de acceso'},
            {'nombre': 'Registrar Accesos', 'codigo': 'access.create', 'codigo': 'Permite registrar accesos'},
        ]

        for priv_data in privilegios:
            privilegio, created = Privilegio.objects.get_or_create(
                codigo=priv_data['codigo'],
                defaults=priv_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Privilegio creado: {privilegio.nombre}'))
            else:
                self.stdout.write(self.style.WARNING(f'Privilegio ya existe: {privilegio.nombre}'))