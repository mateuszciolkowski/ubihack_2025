from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from drf_spectacular.utils import extend_schema, OpenApiExample
from django.contrib.auth import get_user_model
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
