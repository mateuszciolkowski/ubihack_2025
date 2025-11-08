from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from drf_spectacular.utils import extend_schema, OpenApiExample
from django.contrib.auth import get_user_model
from collections import defaultdict

from .models import Patient, Visit

User = get_user_model()
from .serializers import (
    PatientSerializer,
    VisitSerializer,
    VisitSimulationInputSerializer,
)
from .services import create_session_simulation, ai_analysis_service
from django.utils import timezone

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer


class VisitViewSet(viewsets.ModelViewSet):
    queryset = Visit.objects.all()
    serializer_class = VisitSerializer


class PatientWithVisitsView(APIView):
    serializer_class = PatientSerializer

    def get(self, request, pk):
        try:
            patient = Patient.objects.get(pk=pk)
        except Patient.DoesNotExist:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.serializer_class(patient)
        return Response(serializer.data)


class CreateSessionSimulationView(APIView):
    """
    Endpoint do tworzenia symulacji sesji.
    Generuje timeline_data i zapisuje dane do bazy.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = VisitSimulationInputSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    
    @extend_schema(
    summary="Utwórz wizytę z symulacją dla pacjenta",
        description="""
        Generuje symulowane dane sesji używając generate_simulated_data z data_simulator.
        Dane biometryczne są klasyfikowane przez model ML.
        
        Parametry:
    - patient_id: ID pacjenta w URL (wymagane)
        
        Parametry (opcjonalne w body):
    - visit_date: Data wizyty (opcjonalna)
        - duration_sec: Długość symulacji w sekundach (domyślnie 300)
        
        Endpoint automatycznie:
        - Znajduje użytkownika po ID
        - Tworzy nową sesję dla tego użytkownika
        - Generuje dane biometryczne (ACC, BVP, EDA, TEMP)
        - Klasyfikuje stany emocjonalne używając modelu ML
        - Oblicza step_size, total_duration_seconds i procenty stanów
        - Zapisuje wszystko do bazy danych
        """,
        request=VisitSimulationInputSerializer,
        responses={
            201: VisitSerializer,
            404: {'description': 'Pacjent nie istnieje'},
        }
    )
    def post(self, request, patient_id):
        # Znajdź pacjenta
        try:
            patient = Patient.objects.get(pk=patient_id)
        except Patient.DoesNotExist:
            return Response(
                {"detail": f"Patient o ID {patient_id} nie istnieje"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Waliduj dane wejściowe
        serializer = VisitSimulationInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        duration_sec = data.get('duration_sec', 300)
        
        # Generuj timeline_data używając generate_simulated_data i klasyfikacji
        timeline_data, metadata = create_session_simulation(duration_sec=duration_sec)

        # Utwórz wizytę przypisaną do pacjenta
        visit_date = data.get('visit_date') or timezone.now()
        visit = Visit.objects.create(
            patient=patient,
            visit_date=visit_date,
            step_size=metadata['step_size'],
            total_duration_seconds=metadata['total_duration_seconds'],
            baseline_percentage=metadata['baseline_percentage'],
            stress_percentage=metadata['stress_percentage'],
            amusement_percentage=metadata['amusement_percentage'],
            meditation_percentage=metadata['meditation_percentage'],
            timeline_data=timeline_data
        )

        # Zwróć wizytę wraz z timeline
        response_serializer = VisitSerializer(visit)
        return Response({
            "visit": response_serializer.data,
            "timeline": timeline_data
        }, status=status.HTTP_201_CREATED)


class AIAnalysisServiceView(APIView):
    """
    Endpoint do generowania analizy AI dla sesji.
    Używa OpenAI do stworzenia narracyjnego podsumowania.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = VisitSerializer
    
    @extend_schema(
    summary="Generuj analizę AI dla wizyty",
        description="""
        Analizuje dane sesji i generuje narracyjne podsumowanie używając OpenAI.
        Wymaga, aby sesja miała już wygenerowane timeline_data.
        
        Parametry:
    - visit_id: ID wizyty do analizy (w URL)
        
        Zwraca:
        - session: Pełne dane sesji z wygenerowanym ai_summary_story
        - ai_summary: Wygenerowane podsumowanie
        """,
        responses={
            200: VisitSerializer,
            400: {'description': 'Wizyta nie ma danych timeline'},
            404: {'description': 'Wizyta nie istnieje'},
            500: {'description': 'Błąd podczas generowania analizy AI'},
        }
    )
    def post(self, request, visit_id):
        try:
            visit = Visit.objects.get(pk=visit_id)
        except Visit.DoesNotExist:
            return Response(
                {"detail": f"Visit o ID {visit_id} nie istnieje"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Sprawdź czy timeline_data istnieje
        if not (visit.timeline_data or visit.stress_history):
            return Response(
                {"detail": "Wizyta nie ma wygenerowanych danych timeline. Najpierw utwórz symulację."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Przygotuj dane do analizy
        session_data = {
            'timeline_data': visit.timeline_data or visit.stress_history or [],
            'total_duration_seconds': visit.total_duration_seconds,
            'baseline_percentage': visit.baseline_percentage,
            'stress_percentage': visit.stress_percentage,
            'amusement_percentage': visit.amusement_percentage,
            'meditation_percentage': visit.meditation_percentage
        }

        try:
            # Generuj analizę AI
            ai_summary = ai_analysis_service(session_data)

            # Zaktualizuj wizytę
            visit.ai_summary_story = ai_summary
            visit.ai_summary = ai_summary
            visit.save()

            response_serializer = VisitSerializer(visit)
            return Response({
                "visit": response_serializer.data,
                "ai_summary": ai_summary
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"detail": f"Błąd podczas generowania analizy AI: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class StressClassDistributionView(APIView):
    """
    Endpoint do obliczania procentowego udziału klas stresu dla każdego pacjenta i każdej sesji.
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="Oblicz procentowy udział klas stresu",
        description=""" 
        Oblicza łączny procentowy udział klas stresu dla każdego pacjenta i każdej sesji.
        
        Zwraca:
        - patients: Lista pacjentów z agregowanymi procentami klas stresu
        - sessions: Lista wszystkich sesji z procentami klas stresu
        
        Klasy stresu:
        - Baseline
        - Stress
        - Amusement
        - Meditation
        
        Procenty są obliczane jako średnie ważone na podstawie czasu trwania sesji.
        """,
        responses={
            200: {
                'description': 'Sukces - zwraca rozkład klas stresu',
                'examples': {
                    'application/json': {
                        'patients': [
                            {
                                'patient_id': 1,
                                'patient_name': 'Jan Kowalski',
                                'total_sessions': 3,
                                'total_duration_seconds': 900,
                                'stress_classes': {
                                    'baseline_percentage': 45.2,
                                    'stress_percentage': 25.8,
                                    'amusement_percentage': 15.0,
                                    'meditation_percentage': 14.0
                                }
                            }
                        ],
                        'sessions': [
                            {
                                'session_id': 1,
                                'patient_id': 1,
                                'patient_name': 'Jan Kowalski',
                                'duration_seconds': 300,
                                'stress_classes': {
                                    'baseline_percentage': 40.0,
                                    'stress_percentage': 30.0,
                                    'amusement_percentage': 20.0,
                                    'meditation_percentage': 10.0
                                }
                            }
                        ]
                    }
                }
            }
        }
    )
    def get(self, request):
        """
        GET /api/patient-management/stress-class-distribution/
        
        Oblicza procentowy udział klas stresu dla każdego pacjenta i każdej sesji.
        """
        # Pobierz wszystkie wizyty (każda wizyta ma pacjenta)
        visits = Visit.objects.select_related('patient').all()
        
        # Struktury do przechowywania danych
        patients_data = defaultdict(lambda: {
            'patient_id': None,
            'patient_name': '',
            'total_sessions': 0,
            'total_duration_seconds': 0,
            'weighted_baseline': 0.0,
            'weighted_stress': 0.0,
            'weighted_amusement': 0.0,
            'weighted_meditation': 0.0,
            'total_weight': 0.0
        })
        
        sessions_list = []
        
        # Przetwórz każdą sesję
        for visit in visits:
            patient = visit.patient
            patient_id = patient.id
            patient_name = f"{patient.first_name} {patient.last_name}"

            # Pobierz procenty z wizyty (jeśli są null, użyj 0)
            baseline = visit.baseline_percentage or 0.0
            stress = visit.stress_percentage or 0.0
            amusement = visit.amusement_percentage or 0.0
            meditation = visit.meditation_percentage or 0.0

            # Czas trwania wizyty (używany jako waga)
            duration = visit.total_duration_seconds or 0

            # Dodaj dane wizyty do listy (nazwa pola session_id pozostawiona dla kompatybilności)
            sessions_list.append({
                'session_id': visit.id,
                'patient_id': patient_id,
                'patient_name': patient_name,
                'visit_id': visit.id,
                'duration_seconds': duration,
                'created_at': visit.visit_date.isoformat() if visit.visit_date else None,
                'stress_classes': {
                    'baseline_percentage': round(baseline, 2),
                    'stress_percentage': round(stress, 2),
                    'amusement_percentage': round(amusement, 2),
                    'meditation_percentage': round(meditation, 2)
                }
            })

            # Agreguj dane dla pacjenta (średnia ważona)
            patient_data = patients_data[patient_id]
            patient_data['patient_id'] = patient_id
            patient_data['patient_name'] = patient_name
            patient_data['total_sessions'] += 1
            patient_data['total_duration_seconds'] += duration

            # Oblicz średnią ważoną
            if duration > 0:
                patient_data['weighted_baseline'] += baseline * duration
                patient_data['weighted_stress'] += stress * duration
                patient_data['weighted_amusement'] += amusement * duration
                patient_data['weighted_meditation'] += meditation * duration
                patient_data['total_weight'] += duration
        
        # Przygotuj listę pacjentów z obliczonymi procentami
        patients_list = []
        for patient_id, patient_data in patients_data.items():
            total_weight = patient_data['total_weight']
            
            # Oblicz średnie ważone procenty
            if total_weight > 0:
                baseline_avg = patient_data['weighted_baseline'] / total_weight
                stress_avg = patient_data['weighted_stress'] / total_weight
                amusement_avg = patient_data['weighted_amusement'] / total_weight
                meditation_avg = patient_data['weighted_meditation'] / total_weight
            else:
                baseline_avg = 0.0
                stress_avg = 0.0
                amusement_avg = 0.0
                meditation_avg = 0.0
            
            patients_list.append({
                'patient_id': patient_data['patient_id'],
                'patient_name': patient_data['patient_name'],
                'total_sessions': patient_data['total_sessions'],
                'total_duration_seconds': patient_data['total_duration_seconds'],
                'stress_classes': {
                    'baseline_percentage': round(baseline_avg, 2),
                    'stress_percentage': round(stress_avg, 2),
                    'amusement_percentage': round(amusement_avg, 2),
                    'meditation_percentage': round(meditation_avg, 2)
                }
            })
        
        # Sortuj listy
        patients_list.sort(key=lambda x: x['patient_id'])
        sessions_list.sort(key=lambda x: x['session_id'])
        
        return Response({
            'patients': patients_list,
            'sessions': sessions_list,
            'summary': {
                'total_patients': len(patients_list),
                'total_sessions': len(sessions_list)
            }
        }, status=status.HTTP_200_OK)
