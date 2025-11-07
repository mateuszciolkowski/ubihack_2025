from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from drf_spectacular.utils import extend_schema, OpenApiExample
from .serializers import StressClassificationRequestSerializer
from .ml_service import StressClassificationService
from .data_simulator import generate_simulated_data
import numpy as np
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Singleton instance serwisu
_stress_service = None

def get_stress_service():
    """Zwraca singleton instance serwisu klasyfikacji."""
    global _stress_service
    if _stress_service is None:
        _stress_service = StressClassificationService()
        try:
            _stress_service.load_model()
            logger.info("Model klasyfikacji stresu załadowany pomyślnie")
        except Exception as e:
            logger.error(f"Błąd podczas ładowania modelu: {e}")
            raise
    return _stress_service


class StressClassificationView(APIView):
    """
    Endpoint do klasyfikacji poziomu stresu na podstawie sygnałów biometrycznych.
    
    Akceptuje dane z czujników (ACC, BVP, EDA, TEMP) lub używa symulowanych danych.
    Zwraca szczegółową analizę stresu w formacie JSON.
    """
    permission_classes = [AllowAny]  # Można zmienić na IsAuthenticated jeśli potrzeba
    
    @extend_schema(
        summary="Klasyfikacja stresu",
        description="""
        Analizuje sygnały biometryczne i zwraca szczegółową klasyfikację poziomu stresu.
        
        Możesz:
        - Wysłać rzeczywiste dane z czujników (acc, bvp, eda, temp)
        - Użyć symulowanych danych (use_simulation=true, domyślnie)
        
        Zwraca JSON z:
        - Metadata: informacje o analizie
        - Summary: podsumowanie poziomu stresu
        - Statistics: statystyki rozkładu klas
        - Segments: lista wszystkich segmentów czasowych z predykcjami
        - Stress moments: lista momentów wykrytego stresu
        """,
        request=StressClassificationRequestSerializer,
        responses={
            200: {
                'description': 'Sukces - zwraca analizę stresu w formacie JSON',
                'examples': {
                    'application/json': {
                        'metadata': {
                            'analysis_date': '2025-11-07T22:22:27.764764',
                            'start_timestamp': '2025-11-07T22:22:27.761766',
                            'total_duration_seconds': 5210,
                            'num_segments': 521
                        },
                        'summary': {
                            'overall_stress_level': 'Niski',
                            'overall_stress_value': 1,
                            'stress_percentage': 22.07
                        },
                        'segments': [],
                        'stress_moments': []
                    }
                }
            },
            400: {'description': 'Błąd walidacji danych wejściowych'},
            500: {'description': 'Błąd serwera - problem z modelem lub przetwarzaniem'}
        },
        examples=[
            OpenApiExample(
                'Symulowane dane',
                value={
                    'use_simulation': True
                },
                request_only=True
            ),
            OpenApiExample(
                'Rzeczywiste dane',
                value={
                    'use_simulation': False,
                    'acc': [[0.1, 0.2, 0.3], [0.2, 0.3, 0.4]],
                    'bvp': [0.5, 0.6, 0.7],
                    'eda': [0.3, 0.4, 0.5],
                    'temp': [36.5, 36.6, 36.7],
                    'start_timestamp': '2025-11-07T10:00:00'
                },
                request_only=True
            )
        ]
    )
    def post(self, request):
        """
        POST /api/stress-classification/
        
        Klasyfikuje poziom stresu na podstawie sygnałów biometrycznych.
        """
        serializer = StressClassificationRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {'error': 'Błąd walidacji', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        validated_data = serializer.validated_data
        
        try:
            # Pobierz serwis klasyfikacji
            service = get_stress_service()
            
            # Określ czy użyć symulacji
            use_simulation = validated_data.get('use_simulation', True)
            
            # Sprawdź czy wszystkie dane są podane
            has_all_data = all([
                validated_data.get('acc'),
                validated_data.get('bvp'),
                validated_data.get('eda'),
                validated_data.get('temp')
            ])
            
            if use_simulation or not has_all_data:
                # Użyj symulowanych danych
                logger.info("Używanie symulowanych danych")
                acc, bvp, eda, temp = generate_simulated_data()
            else:
                # Użyj rzeczywistych danych
                logger.info("Używanie rzeczywistych danych z żądania")
                acc_data = validated_data.get('acc', [])
                bvp_data = validated_data.get('bvp', [])
                eda_data = validated_data.get('eda', [])
                temp_data = validated_data.get('temp', [])
                
                # Konwersja do numpy arrays
                acc = np.array(acc_data)
                bvp = np.array(bvp_data)
                eda = np.array(eda_data)
                temp = np.array(temp_data)
                
                # Walidacja wymiarów
                if len(acc.shape) != 2 or acc.shape[1] != 3:
                    return Response(
                        {'error': 'ACC musi być tablicą 2D z 3 kolumnami (lista list [x, y, z])'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                if len(bvp.shape) != 1:
                    return Response(
                        {'error': 'BVP musi być tablicą 1D'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                if len(eda.shape) != 1:
                    return Response(
                        {'error': 'EDA musi być tablicą 1D'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                if len(temp.shape) != 1:
                    return Response(
                        {'error': 'TEMP musi być tablicą 1D'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Parsowanie timestampu
            start_timestamp = validated_data.get('start_timestamp')
            if start_timestamp:
                if isinstance(start_timestamp, str):
                    start_timestamp = datetime.fromisoformat(start_timestamp.replace('Z', '+00:00'))
            else:
                start_timestamp = datetime.now()
            
            # Wykonaj klasyfikację
            result = service.classify(acc, bvp, eda, temp, start_timestamp)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except FileNotFoundError as e:
            logger.error(f"Nie znaleziono pliku: {e}")
            return Response(
                {'error': 'Model nie znaleziony', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except ValueError as e:
            logger.error(f"Błąd walidacji danych: {e}")
            return Response(
                {'error': 'Błąd walidacji danych', 'details': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Błąd podczas klasyfikacji: {e}", exc_info=True)
            return Response(
                {'error': 'Błąd podczas klasyfikacji', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

