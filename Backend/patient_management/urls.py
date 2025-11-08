from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PatientViewSet, 
    VisitViewSet, 
    PatientWithVisitsView,
    SessionViewSet,
    CreateSessionSimulationView,
    AIAnalysisServiceView,
    StressClassDistributionView
)

router = DefaultRouter()
router.register(r'patients', PatientViewSet)
router.register(r'visits', VisitViewSet)
router.register(r'sessions', SessionViewSet)

urlpatterns = [
    # Specyficzne ścieżki muszą być przed routerem, aby uniknąć konfliktów
    path('sessions/user/<int:user_id>/simulate/', CreateSessionSimulationView.as_view(), name='create-session-simulation'),
    path('sessions/<int:session_id>/analyze/', AIAnalysisServiceView.as_view(), name='ai-analysis-service'),
    path('patients/<int:pk>/full/', PatientWithVisitsView.as_view(), name='patient-with-visits'),
    path('stress-class-distribution/', StressClassDistributionView.as_view(), name='stress-class-distribution'),
    path('', include(router.urls)),
]
