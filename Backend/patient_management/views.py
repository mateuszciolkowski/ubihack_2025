from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from drf_spectacular.utils import extend_schema, OpenApiExample
from django.contrib.auth import get_user_model
from collections import defaultdict

from .models import Patient, Visit, Session

User = get_user_model()
from .serializers import (
    PatientSerializer, 
    VisitSerializer, 
    SessionSerializer,
    SessionSimulationInputSerializer
)
from .services import create_session_simulation, ai_analysis_service

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


class SessionViewSet(viewsets.ModelViewSet):
    """ViewSet dla modelu Session"""
    queryset = Session.objects.all()
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated]


class CreateSessionSimulationView(APIView):
    """
    Endpoint do tworzenia symulacji sesji.
    Generuje timeline_data i zapisuje dane do bazy.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = SessionSimulationInputSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    
    @extend_schema(
        summary="Utwórz sesję z symulacją dla użytkownika",
        description="""
        Generuje symulowane dane sesji używając generate_simulated_data z data_simulator.
        Dane biometryczne są klasyfikowane przez model ML.
        
        Parametry:
        - user_id: ID użytkownika w URL (wymagane)
        
        Parametry (opcjonalne w body):
        - visit_id: ID wizyty do powiązania
        - duration_sec: Długość symulacji w sekundach (domyślnie 300)
        
        Endpoint automatycznie:
        - Znajduje użytkownika po ID
        - Tworzy nową sesję dla tego użytkownika
        - Generuje dane biometryczne (ACC, BVP, EDA, TEMP)
        - Klasyfikuje stany emocjonalne używając modelu ML
        - Oblicza step_size, total_duration_seconds i procenty stanów
        - Zapisuje wszystko do bazy danych
        """,
        request=SessionSimulationInputSerializer,
        responses={
            201: SessionSerializer,
            404: {'description': 'Użytkownik nie istnieje'},
        }
    )
    def post(self, request, user_id):
        # Znajdź użytkownika
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {"detail": f"User o ID {user_id} nie istnieje"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Waliduj dane wejściowe
        serializer = SessionSimulationInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        duration_sec = data.get('duration_sec', 300)
        
        # Pobierz visit jeśli podano visit_id
        visit = None
        if data.get('visit_id'):
            try:
                visit = Visit.objects.get(pk=data['visit_id'])
            except Visit.DoesNotExist:
                return Response(
                    {"detail": f"Visit o ID {data['visit_id']} nie istnieje"},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Generuj timeline_data używając generate_simulated_data i klasyfikacji
        timeline_data, metadata = create_session_simulation(duration_sec=duration_sec)
        
        # Utwórz sesję dla użytkownika z wygenerowanymi danymi
        session = Session.objects.create(
            user=user,
            visit=visit,
            step_size=metadata['step_size'],
            total_duration_seconds=metadata['total_duration_seconds'],
            baseline_percentage=metadata['baseline_percentage'],
            stress_percentage=metadata['stress_percentage'],
            amusement_percentage=metadata['amusement_percentage'],
            meditation_percentage=metadata['meditation_percentage'],
            timeline_data=timeline_data
        )
        
        # Zwróć sesję wraz z timeline
        response_serializer = SessionSerializer(session)
        return Response({
            "session": response_serializer.data,
            "timeline": timeline_data
        }, status=status.HTTP_201_CREATED)


class AIAnalysisServiceView(APIView):
    """
    Endpoint do generowania analizy AI dla sesji.
    Używa OpenAI do stworzenia narracyjnego podsumowania.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = SessionSerializer
    
    @extend_schema(
        summary="Generuj analizę AI dla sesji",
        description="""
        Analizuje dane sesji i generuje narracyjne podsumowanie używając OpenAI.
        Wymaga, aby sesja miała już wygenerowane timeline_data.
        
        Parametry:
        - session_id: ID sesji do analizy (w URL)
        
        Zwraca:
        - session: Pełne dane sesji z wygenerowanym ai_summary_story
        - ai_summary: Wygenerowane podsumowanie
        """,
        responses={
            200: SessionSerializer,
            400: {'description': 'Sesja nie ma danych timeline'},
            404: {'description': 'Sesja nie istnieje'},
            500: {'description': 'Błąd podczas generowania analizy AI'},
        }
    )
    def post(self, request, session_id):
        try:
            session = Session.objects.get(pk=session_id)
        except Session.DoesNotExist:
            return Response(
                {"detail": f"Session o ID {session_id} nie istnieje"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Sprawdź czy timeline_data istnieje
        if not session.timeline_data:
            return Response(
                {"detail": "Session nie ma wygenerowanych danych timeline. Najpierw utwórz symulację."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Przygotuj dane do analizy
        session_data = {
            'timeline_data': session.timeline_data,
            'total_duration_seconds': session.total_duration_seconds,
            'baseline_percentage': session.baseline_percentage,
            'stress_percentage': session.stress_percentage,
            'amusement_percentage': session.amusement_percentage,
            'meditation_percentage': session.meditation_percentage
        }
        
        try:
            # Generuj analizę AI
            ai_summary = ai_analysis_service(session_data)
            
            # Zaktualizuj sesję
            session.ai_summary_story = ai_summary
            session.save()
            
            response_serializer = SessionSerializer(session)
            return Response({
                "session": response_serializer.data,
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
        # Pobierz wszystkie sesje, które mają przypisaną wizytę (a więc i pacjenta)
        sessions = Session.objects.filter(visit__isnull=False).select_related('visit', 'visit__patient')
        
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
        for session in sessions:
            patient = session.visit.patient
            patient_id = patient.id
            patient_name = f"{patient.first_name} {patient.last_name}"
            
            # Pobierz procenty z sesji (jeśli są null, użyj 0)
            baseline = session.baseline_percentage or 0.0
            stress = session.stress_percentage or 0.0
            amusement = session.amusement_percentage or 0.0
            meditation = session.meditation_percentage or 0.0
            
            # Czas trwania sesji (używany jako waga)
            duration = session.total_duration_seconds or 0
            
            # Dodaj dane sesji do listy
            sessions_list.append({
                'session_id': session.id,
                'patient_id': patient_id,
                'patient_name': patient_name,
                'visit_id': session.visit.id if session.visit else None,
                'duration_seconds': duration,
                'created_at': session.created_at.isoformat() if session.created_at else None,
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
