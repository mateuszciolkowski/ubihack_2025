from django.urls import path
from .views import StressClassificationView

app_name = 'stress_classification'

urlpatterns = [
    path('', StressClassificationView.as_view(), name='classify'),
]

