from rest_framework import serializers
from .models import Patient, Visit, Session

class VisitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visit
        fields = '__all__'

class PatientSerializer(serializers.ModelSerializer):
    visits = VisitSerializer(many=True, read_only=True)

    class Meta:
        model = Patient
        fields = ['id', 'first_name', 'last_name', 'dob', 'gender', 'pesel', 'notes', 'visits']


class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class SessionSimulationInputSerializer(serializers.Serializer):
    """Serializer dla danych wejściowych do symulacji sesji"""
    duration_sec = serializers.IntegerField(min_value=1, required=False, default=300, help_text="Długość symulacji w sekundach (domyślnie 300)")
    visit_id = serializers.IntegerField(required=False, allow_null=True)
