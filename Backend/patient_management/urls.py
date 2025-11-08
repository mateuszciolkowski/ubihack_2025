from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PatientViewSet, 
    VisitViewSet, 
    PatientWithVisitsView,
    CreateSessionSimulationView,
    AIAnalysisServiceView,
    StressClassDistributionView
)

router = DefaultRouter()
router.register(r'patients', PatientViewSet)
router.register(r'visits', VisitViewSet)


urlpatterns = [
    # Specyficzne ścieżki muszą być przed routerem, aby uniknąć konfliktów
    path('visits/patient/<int:patient_id>/simulate/', CreateSessionSimulationView.as_view(), name='create-visit-simulation'),
    path('visits/<int:visit_id>/analyze/', AIAnalysisServiceView.as_view(), name='ai-analysis-service'),
    path('patients/<int:pk>/full/', PatientWithVisitsView.as_view(), name='patient-with-visits'),
    path('stress-class-distribution/', StressClassDistributionView.as_view(), name='stress-class-distribution'),
    path('', include(router.urls)),
]
