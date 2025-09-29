import json
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from django.core.cache import cache
from ..models import RostroUsuario

class FacialRecognitionService:
    def __init__(self):
        self.umbral_confianza = 0.7  # Umbral mínimo para considerar una coincidencia
        
    def calcular_similitud(self, embedding1, embedding2):
        """Calcular similitud coseno entre dos embeddings"""
        try:
            # Convertir strings JSON a arrays numpy
            if isinstance(embedding1, str):
                emb1 = np.array(json.loads(embedding1)).reshape(1, -1)
            else:
                emb1 = np.array(embedding1).reshape(1, -1)
                
            if isinstance(embedding2, str):
                emb2 = np.array(json.loads(embedding2)).reshape(1, -1)
            else:
                emb2 = np.array(embedding2).reshape(1, -1)
            
            # Calcular similitud coseno
            similitud = cosine_similarity(emb1, emb2)[0][0]
            return max(0.0, min(1.0, similitud))
            
        except Exception as e:
            print(f"Error calculando similitud: {e}")
            return 0.0

    def reconocer_rostro(self, embedding_entrante):
        """Reconocer un rostro comparándolo con todos los rostros registrados"""
        try:
            # Obtener todos los rostros activos de la cache o de la base de datos
            cache_key = "rostros_activos_embeddings"
            rostros_data = cache.get(cache_key)
            
            if rostros_data is None:
                rostros_activos = RostroUsuario.objects.filter(esta_activo=True)
                rostros_data = []
                for rostro in rostros_activos:
                    try:
                        embedding = json.loads(rostro.embedding)
                        rostros_data.append({
                            'usuario_id': rostro.usuario.id,
                            'usuario_nombre': rostro.usuario.get_full_name(),
                            'embedding': embedding,
                            'rostro_id': rostro.id
                        })
                    except json.JSONDecodeError:
                        continue
                
                # Cachear por 5 minutos
                cache.set(cache_key, rostros_data, 300)
            
            mejor_confianza = 0.0
            usuario_reconocido = None
            rostro_reconocido_id = None
            
            for rostro_data in rostros_data:
                confianza = self.calcular_similitud(embedding_entrante, rostro_data['embedding'])
                
                if confianza > mejor_confianza and confianza >= self.umbral_confianza:
                    mejor_confianza = confianza
                    usuario_reconocido = {
                        'id': rostro_data['usuario_id'],
                        'nombre': rostro_data['usuario_nombre']
                    }
                    rostro_reconocido_id = rostro_data['rostro_id']
            
            return {
                'reconocido': usuario_reconocido is not None,
                'usuario': usuario_reconocido,
                'confianza': mejor_confianza,
                'rostro_id': rostro_reconocido_id
            }
            
        except Exception as e:
            print(f"Error en reconocimiento facial: {e}")
            return {
                'reconocido': False,
                'usuario': None,
                'confianza': 0.0,
                'rostro_id': None
            }

    def determinar_tipo_acceso(self, usuario_id):
        """Determinar si es entrada o salida basado en el último acceso"""
        try:
            from ..models import RegistroAcceso
            
            # Obtener el último acceso del usuario
            ultimo_acceso = RegistroAcceso.objects.filter(
                usuario_id=usuario_id
            ).order_by('-timestamp').first()
            
            if not ultimo_acceso:
                return 'entrada'  # Si no hay registros previos, es una entrada
            
            # Si el último acceso fue una entrada, entonces ahora es salida, y viceversa
            return 'salida' if ultimo_acceso.tipo_acceso == 'entrada' else 'entrada'
            
        except Exception as e:
            print(f"Error determinando tipo de acceso: {e}")
            return 'entrada'  # Por defecto asumir entrada

# Instancia global del servicio
facial_service = FacialRecognitionService()